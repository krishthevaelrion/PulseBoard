import type { Request, Response } from 'express';
import User from '../models/User.model.ts';

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    // The middleware attached 'user' to the request object
    const userId = req.user?.userId;

    // Fetch user but ONLY get name and interests (lean query)
    const user = await User.findById(userId).select('name following');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};