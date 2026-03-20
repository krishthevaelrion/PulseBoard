import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMail extends Document {
  categoryId: number;   // Links to your Category (101, 102, etc.)
  sender: string;       
  subject: string;      
  body: string;         
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;      // Required for TTL
  updatedAt: Date;
}

const MailSchema: Schema = new Schema(
  {
    categoryId: {
      type: Number,
      required: true,
      index: true 
    },
    sender: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    // --- AUTO-DELETE AFTER 7 DAYS ---
    // The 'expires' value is in seconds. 604800s = 7 days.
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 
    }
  },
  { 
    timestamps: true,
    collection: 'mails' 
  }
);

// --- DEDUPLICATION (UNIQUE INDEX) ---
// This prevents the same sender from sending the exact same subject/body twice.
// If you try to save a duplicate, MongoDB will throw an error.
MailSchema.index({ sender: 1, subject: 1, body: 1 }, { unique: true });

const Mail: Model<IMail> = mongoose.model<IMail>("Mail", MailSchema);
export default Mail;