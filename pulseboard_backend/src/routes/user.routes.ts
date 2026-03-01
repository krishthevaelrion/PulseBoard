import { Router } from "express";
import {
  getMyProfile,
  savePushToken,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/users/me
router.get("/me", authenticate, getMyProfile);

// POST /api/users/save-push-token
router.post(
  "/save-push-token",
  authenticate,
  savePushToken
  
);

export default router;
