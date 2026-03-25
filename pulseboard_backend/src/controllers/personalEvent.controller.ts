import { Request, Response } from 'express';
import PersonalEvent from '../models/PersonalEvent.model';

export const getPersonalEvents = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const events = await PersonalEvent.find({ userId })
            .sort({ date: 1 })
            .lean();

        res.json({ events });
    } catch (err) {
        console.error('[PersonalEvent] Error fetching:', err);
        res.status(500).json({ message: 'Failed to fetch personal events' });
    }
};
