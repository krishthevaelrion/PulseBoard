import { Router } from "express";
import { register, login, googleCallback } from "../controllers/auth.controller.ts";

const router = Router();

router.post("/register", register);
router.post("/login", login); // <--- Add this line
router.post("/google/callback", googleCallback);

export default router;