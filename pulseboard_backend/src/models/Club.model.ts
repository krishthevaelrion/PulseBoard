import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClub extends Document {
  clubId: number;
  name: string;
  description: string;
  category: "Technical" | "Cultural" | "Literary" | "Other";
  followers: number;
}

const ClubSchema: Schema = new Schema(
  {
    clubId: {
      type: Number,
      unique: true,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Technical", "Cultural", "Literary", "Other"],
      required: true,
    },
    followers:
      {
        type: Number,
        default: 0,
      },
  },
  { timestamps: true }
);

const Club: Model<IClub> = mongoose.model<IClub>("Club", ClubSchema);
export default Club;