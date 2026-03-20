import { Router, Request, Response } from "express"; // Added Types
import mongoose from "mongoose"; // Fixes 'mongoose' not found
import { classifyAndGetId } from "../services/classifier.service";
import Mail from "../models/mail.model";

import { getMailsByCategory } from "../controllers/mail.controller";

const router = Router();
router.get('/category/:categoryId', getMailsByCategory);


router.post('/test-ai', async (req: Request, res: Response): Promise<void> => {
    console.log("HIT THE TEST-AI ROUTE!");
    try {
        const { subject, body, sender } = req.body;
        const existingMail = await Mail.findOne({ sender, subject, body });
        
        if (existingMail) {
            console.log("⚠️ Duplicate email detected. Skipping save.");
            res.status(200).json({ 
                message: "Email already exists", 
                data: existingMail 
            });
            return; 
        }
        // 1. Get categoryId
        const categoryId = await classifyAndGetId(subject, body);

        // 2. Create and Save document
        const newMail = new Mail({
            categoryId,
            sender: sender || "Unknown Sender",
            subject,
            body,
            isRead: false,
            priority: categoryId === 101 ? "high" : "medium" 
        });

        const savedMail = await newMail.save();

        // 3. Clean Logs (Avoiding complex constructor checks for now)
        console.log("SUCCESS: Document written to DB!");
        console.log("Database Name:", mongoose.connection.name);

        res.status(200).json({
            status: "AI Classification & Database Save Successful",
            saved_id: savedMail._id,
            assigned_categoryId: categoryId,
            data: savedMail
        });
    } catch (error: any) {
        console.error("Database Save Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// CRITICAL: Ensure this is here so server.ts doesn't fail
export default router;