import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  provider: "local" | "google";
  googleId?: string;
  password?: string;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  year?: number;
  branch?: string;
  following: number[];
  avatar?: string;
  expoPushToken?: string;
  resetOtp?: string;
  resetOtpExpires?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
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
      required: function (this: IUser) {
        return this.provider === "google";
      },
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === "local";
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    expoPushToken: {
      type: String,
    },

    resetOtp: {
      type: String,
    },

    resetOtpExpires: {
      type: Date,
    },

    year: Number,
    branch: String,

    following: {
      type: [Number],
      default: [],
    },

    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
