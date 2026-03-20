import axios from 'axios';
import Category from '../models/category.model';

// 1. Define Universal Interfaces to handle different API response formats
interface HFSinglePrediction {
  label: string;
  score: number;
}

// Fixed the syntax here to correctly use 'type' for the union
type HFResponse = HFSinglePrediction[] | {
  labels: string[];
  scores: number[];
  sequence?: string;
  error?: string;
  estimated_time?: number;
};

const HF_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli";
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

/**
 * Helper to wait/sleep (used for model cold-starts)
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Takes email content and returns the correct categoryId (Number)
 * by matching AI results with your MongoDB categories.
 */
export const classifyAndGetId = async (subject: string, body: string, retryCount = 0): Promise<number> => {
  try {
    // 1. Fetch categories from MongoDB and hide "Miscellaneous" from the AI's options
    const categories = await Category.find({});
    const candidateLabels = categories
      .map(cat => cat.name)
      .filter(name => name.toLowerCase() !== "miscellaneous");

    if (candidateLabels.length === 0) {
      console.log("⚠️ No specific categories found in DB. Defaulting to 103.");
      return 103;
    }

    const text = `Subject: ${subject} \nContent: ${body.substring(0, 1000)}`; 

    // 2. Call Hugging Face API
    const response = await axios.post<HFResponse>(
      HF_API_URL,
      {
        inputs: text,
        parameters: { candidate_labels: candidateLabels },
        options: { wait_for_model: true } 
      },
      { 
        headers: { 
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 30000 
      }
    );

    // 3. Check for Model Loading status (Estimated Time)
    // We check if 'estimated_time' exists on the object format
    if (!Array.isArray(response.data) && response.data.estimated_time && retryCount < 3) {
      const waitTime = Math.ceil(response.data.estimated_time) * 1000;
      console.log(`⏳ Model is loading. Waiting ${waitTime/1000}s (Attempt ${retryCount + 1})...`);
      await sleep(waitTime);
      return classifyAndGetId(subject, body, retryCount + 1);
    }

    // 4. Universal Extraction Logic
    let winningName = "";
    let confidence = 0;

    // Handle Array format: [{label: 'x', score: 0.9}, ...]
    if (Array.isArray(response.data)) {
      if (response.data.length > 0) {
        winningName = response.data[0].label;
        confidence = response.data[0].score;
      }
    } 
    // Handle Object format: {labels: ['x'], scores: [0.9]}
    else if (response.data.labels && response.data.labels.length > 0) {
      winningName = response.data.labels[0];
      confidence = response.data.scores[0];
    }

    // Safety guard if extraction failed
    if (!winningName) {
      console.error("❌ Could not extract labels from AI response:", response.data);
      return 103;
    }

    console.log(`✅ AI Predicted: "${winningName}" with ${(confidence * 100).toFixed(2)}% confidence.`);

    // 5. Confidence Threshold (50%)
    if (confidence < 0.7) {
      console.log("📉 Confidence too low (< 70%). Categorizing as Miscellaneous.");
      return 103;
    }

    // 6. Final Match with DB (Case-Insensitive and Trimmed)
    const winningCategory = categories.find(
      (cat) => cat.name.trim().toLowerCase() === winningName.trim().toLowerCase()
    );

    if (!winningCategory) {
      console.log(`❓ AI picked "${winningName}" but it doesn't match any name in your DB list.`);
      return 103;
    }

    return winningCategory.categoryId;

  } catch (error: any) {
    const errorData = error.response?.data;
    
    // Retry if the error message specifically mentions loading
    if (errorData?.error?.includes("loading") && retryCount < 3) {
        console.log("⏳ Model still loading error. Retrying in 5s...");
        await sleep(5000);
        return classifyAndGetId(subject, body, retryCount + 1);
    }

    console.error("❌ AI Classification Error:", errorData || error.message);
    return 103; 
  }
};