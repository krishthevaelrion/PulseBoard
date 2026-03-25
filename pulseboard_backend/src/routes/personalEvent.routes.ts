import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getPersonalEvents } from '../controllers/personalEvent.controller';

const router = Router();

// GET /api/personal-events — returns personal events for the logged-in user
router.get('/', authenticate, getPersonalEvents);

export default router;
