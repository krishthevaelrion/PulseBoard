import type { Request, Response } from 'express';
import Event from '../models/Event.model'; // Removed .ts extension for standard import

// --- Create Event ---
export const createEvent = async (req: Request, res: Response) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error });
  }
};

// --- Get Feed ---
export const getEventFeed = async (req: Request, res: Response) => {
  try {
    const events = await Event.aggregate([
      { 
        $match: { 
          badge: { $in: ['LIVE', 'UPCOMING'] } 
        } 
      },
      {
        $lookup: {
          from: 'clubs',          
          localField: 'clubId',   
          foreignField: 'clubId', 
          as: 'clubInfo'          
        }
      },
      { 
        $unwind: {
          path: '$clubInfo',
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $addFields: {
          clubName: '$clubInfo.name',
          category: '$clubInfo.category'
        }
      },
      {
        $project: {
          clubInfo: 0 
        }
      },
      { 
        $sort: { date: 1 } 
      }
    ]);
    
    res.status(200).json(events);
  } catch (error) {
    console.error("Aggregation Error:", error);
    res.status(500).json({ message: 'Error fetching event feed', error });
  }
};
// --- Get Events for a Single Club ---
export const getEventsByClubId = async (req: Request, res: Response) => {
  try {
    const { clubId } = req.params;
    // We find all events where clubId matches and sort by date
    const events = await Event.find({ 
      clubId: Number(clubId),
      badge: { $in: ['LIVE', 'UPCOMING'] } 
    }).sort({ date: 1 });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events for this club', error });
  }
};