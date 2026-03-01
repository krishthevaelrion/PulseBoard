import { Router } from "express";
import { register, login, googleCallback } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google/callback", googleCallback);

export default router;