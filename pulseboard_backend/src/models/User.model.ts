import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  provider: "local" | "google";
  googleId?: string;
  password?: string;
  year?: number;
  branch?: string;
  following: number[]; 
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      required: true,
    },

    googleId: {
      type: String,
      required: function (this: any) {
        return this.provider === "google";
      },
    },

    password: {
      type: String,
      required: function (this: any) {
        return this.provider === "local";
      },
    },

    year: Number,
    branch: String,

    following: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;