import { Router } from "express";
import { createClub, toggleFollowClub, getAllClubs, getClubById } from "../controllers/club.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createClub);
router.post("/follow/:clubId", authenticate, toggleFollowClub);
router.get("/", getAllClubs);
router.get("/:id",getClubById);

export default router;
