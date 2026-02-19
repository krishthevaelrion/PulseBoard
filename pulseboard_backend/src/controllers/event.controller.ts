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

// --- Get Feed (The "Join" Logic) ---
export const getEventFeed = async (req: Request, res: Response) => {
  try {
    const events = await Event.aggregate([
      // 1. Filter for valid badges
      { 
        $match: { 
          badge: { $in: ['LIVE', 'UPCOMING'] } 
        } 
      },
      // 2. Lookup (Join) events.clubId == clubs.clubId
      {
        $lookup: {
          from: 'clubs',          // Must match your MongoDB collection name exactly
          localField: 'clubId',   // Field in Event (Number)
          foreignField: 'clubId', // FIX: Changed from 'id' to 'clubId' to match your Model
          as: 'clubInfo'          // Temporary name for joined data
        }
      },
      // 3. Unwind (Convert array -> object)
      // preserveNullAndEmptyArrays: true prevents events from vanishing if club lookup fails
      { 
        $unwind: {
          path: '$clubInfo',
          preserveNullAndEmptyArrays: true 
        }
      },
      // 4. Flatten the Data (Pull Name/Category out of clubInfo)
      {
        $addFields: {
          clubName: '$clubInfo.name',
          category: '$clubInfo.category'
        }
      },
      // 5. Clean up (Remove the heavy clubInfo object)
      {
        $project: {
          clubInfo: 0 
        }
      },
      // 6. Sort by Date (Soonest first)
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