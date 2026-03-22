import { Router } from "express";
import { register, login, googleCallback, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/google/callback", googleCallback);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;