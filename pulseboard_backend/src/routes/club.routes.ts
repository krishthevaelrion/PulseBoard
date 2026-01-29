import { Router } from "express";
// NOTE: removed the '.ts' extension from imports (standard practice in Node/TS)
import { createClub, toggleFollowClub } from "../controllers/club.controller.ts";
// FIX: Import 'authenticate' (that's the real name inside your file)
import { authenticate } from '../middlewares/auth.middleware.ts';

const router = Router();

router.post("/", createClub); 

// FIX: Use 'authenticate' variable here
router.post('/follow/:clubId', authenticate, toggleFollowClub);

export default router;