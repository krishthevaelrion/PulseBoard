import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getCalendarEvents,
  getMockCalendarEvents,
} from "../controllers/calendar.controller";

const router = Router();

// GET /api/calendar/events            → real personal events from DB (auth required)
// GET /api/calendar/events?category=interviews → filtered by category
// GET /api/calendar/events?from=2026-03-01&to=2026-03-31 → date range
router.get("/events", authenticate, getCalendarEvents);

// GET /api/calendar/mock              → hardcoded test events for UI dev (no auth)
router.get("/mock", getMockCalendarEvents);

export default router;
