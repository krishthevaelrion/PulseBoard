import type { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User.model'; 


const getGravatarUrl = (email: string) => {
  if (!email) return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const jwtPayload = (req as any).user;
    const userId = jwtPayload?.userId; // Ensure this matches your JWT sign payload key

    const user = await User.findById(userId); // Don't .select() yet, get everything first

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userEmail = user.email || ''; 
    const finalAvatarUrl = user.avatar ? user.avatar : getGravatarUrl(userEmail);
    

    // ONLY ONE res.json() call!
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: userEmail,
      avatar: finalAvatarUrl,
      following: user.following || [],
    });

    
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

export const savePushToken = async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    const { expoPushToken } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!expoPushToken) {
      return res.status(400).json({ message: "expoPushToken required" });
    }

    await User.findByIdAndUpdate(
      userId,
      { expoPushToken },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Push token saved",
    });
  } catch (err) {
    console.error("Save push token error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
