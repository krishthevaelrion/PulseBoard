import type { Request, Response } from "express";
import User from "../models/User.model";
import bcrypt from "bcryptjs";
import { getGoogleUser, getGoogleUserFromIdToken } from "../services/googleOAuth.service";
import { sendOtpEmail, generateOtp, sendPasswordResetEmail } from "../services/email.service";
import jwt from "jsonwebtoken";

// OTP validity duration: 10 minutes
const OTP_EXPIRY_MINUTES = 10;

// ─────────────────────────────────────────────
// LOCAL REGISTRATION  (now sends OTP instead of auto-activating)
// ─────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Check if user already exists
    const exists = await User.findOne({ email });

    if (exists && exists.isVerified) {
      return res.status(409).json({ message: "User already exists" });
    }

    // If user exists but is NOT verified, delete old record so they can re-register
    if (exists && !exists.isVerified) {
      await User.deleteOne({ _id: exists._id });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
      isVerified: false,
      otp,
      otpExpiry,
    });

    // Send the OTP email
    await sendOtpEmail(email, otp, name);

    return res.status(201).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      email: user.email,
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Check if OTP has expired
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token (user is now fully registered)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      message: "Email verified successfully!",
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send the new OTP email
    await sendOtpEmail(email, otp, user.name);

    return res.status(200).json({
      message: "A new OTP has been sent to your email.",
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// Google Callback
// Accepts either:
//   { id_token: ".." }  — from Expo mobile (implicit/token flow)
//   { code: ".." }     — from server-side web flow
// ─────────────────────────────────────────────
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { id_token, code } = req.body;

    if (!id_token && !code) {
      return res.status(400).json({ error: "Provide id_token or code" });
    }

    // Resolve the Google user payload
    const googleUser = id_token
      ? await getGoogleUserFromIdToken(id_token)
      : await getGoogleUser(code);

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.sub,
        provider: "google",
        isVerified: true, // Google-authenticated users are auto-verified
      });
    }

    // Create Token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OAuth failed" });
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2. Check if they signed up with Google
    if (user.provider === "google") {
      return res.status(400).json({
        message: "Please use 'Sign in with Google' for this account"
      });
    }

    // 3. Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email first.",
        requiresVerification: true,
        email: user.email,
      });
    }

    // 4. Verify Password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 5. Generate Token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token, user, message: "Login successful" });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.provider === "google") {
      return res.status(400).json({ message: "This account uses Google Sign In. Password reset is not applicable." });
    }

    const otp = generateOtp();
    const resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = resetOtpExpires;
    await user.save();

    await sendPasswordResetEmail(email, otp, user.name);

    return res.status(200).json({ message: "Password reset OTP sent to your email." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// VERIFY RESET OTP
// ─────────────────────────────────────────────
export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.resetOtp || !user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return res.status(400).json({ message: "OTP has expired or is invalid. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    return res.status(200).json({ message: "OTP verified successfully. Please enter your new password." });

  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.resetOtp || !user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return res.status(400).json({ message: "OTP has expired or is invalid. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully. You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};