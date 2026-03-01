import { Router } from 'express';
import { createEvent, getEventFeed, getEventsByClubId } from '../controllers/event.controller'; // .ts extension needed

const router = Router();

// POST /api/events - Create a new event
router.post('/', createEvent);

// GET /api/events/feed - Get the merged feed
router.get('/feed', getEventFeed);

// GET /api/events/club/:clubId
router.get('/club/:clubId', getEventsByClubId);

export default router;