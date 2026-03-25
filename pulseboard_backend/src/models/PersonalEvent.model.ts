import mongoose, { Schema, Document } from 'mongoose';

export interface IPersonalEvent extends Document {
  userId: mongoose.Types.ObjectId;
  gmailMessageId: string;
  title: string;
  description?: string;
  icon: string;
  badge: 'LIVE' | 'UPCOMING';
  date: Date;
  timeDisplay: string;
  location: string;
  color?: string;
  sourceFrom: string;
  sourceSubject: string;
}

const PersonalEventSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gmailMessageId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: '📅' },
    badge: { type: String, enum: ['LIVE', 'UPCOMING'], default: 'UPCOMING' },
    date: { type: Date, required: true },
    timeDisplay: { type: String, required: true },
    location: { type: String, required: true },
    color: { type: String, default: '#CCF900' },
    sourceFrom: { type: String, default: '' },
    sourceSubject: { type: String, default: '' },
  },
  { timestamps: true }
);

// Guarantees each Gmail message is processed exactly once per user
PersonalEventSchema.index({ userId: 1, gmailMessageId: 1 }, { unique: true });

export default mongoose.model<IPersonalEvent>('PersonalEvent', PersonalEventSchema);
