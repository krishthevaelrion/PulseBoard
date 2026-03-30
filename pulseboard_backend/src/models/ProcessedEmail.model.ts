import mongoose, { Schema, Document } from 'mongoose';

/**
 * One record per unique email (identified by RFC 2822 Message-ID header).
 * The Message-ID is the same for all recipients of the same email,
 * so we only call Gemini once and cache the result here.
 */
export interface IProcessedEmail extends Document {
  emailMessageId: string;       // RFC 2822 Message-ID header — same across all recipients
  isEvent: boolean;             // Gemini's decision — cached so we don't re-call per user
  eventTitle?: string;
  eventDescription?: string;
  eventDate?: Date;
  eventTimeDisplay?: string;
  eventLocation?: string;
  eventBadge?: 'LIVE' | 'UPCOMING';
  eventIcon?: string;
  eventColor?: string;
  eventCategory?: string;
  processedByUsers: mongoose.Types.ObjectId[];  // users already handled for this email
}

const ProcessedEmailSchema: Schema = new Schema(
  {
    emailMessageId: { type: String, required: true, unique: true },
    isEvent: { type: Boolean, required: true },
    eventTitle: String,
    eventDescription: String,
    eventDate: Date,
    eventTimeDisplay: String,
    eventLocation: String,
    eventBadge: { type: String, enum: ['LIVE', 'UPCOMING'] },
    eventIcon: String,
    eventColor: String,
    eventCategory: String,
    processedByUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model<IProcessedEmail>('ProcessedEmail', ProcessedEmailSchema);
