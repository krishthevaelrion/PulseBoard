import type { Request, Response } from "express";
import Club from "../models/Club.model.ts"; // removed .ts extension for cleaner import
import User from "../models/User.model.ts"; // removed .ts extension for cleaner import

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// --- Create Club ---
export const createClub = async (req: Request, res: Response) => {
  try {
    const { clubId, name, description, category } = req.body;

    if (!clubId || !name || !description || !category) {
      return res.status(400).json({ message: "Please provide clubId, name, description, and category" });
    }

    const existingClub = await Club.findOne({ $or: [{ name }, { clubId }] });
    if (existingClub) {
      return res.status(400).json({ message: "Club or ID already exists" });
    }

    // New clubs start with 0 followers automatically via default value in Schema
    const newClub = new Club({ clubId, name, description, category });
    const savedClub = await newClub.save();

    res.status(201).json({ message: "Club created successfully", club: savedClub });
  } catch (error) {
    console.error("Error creating club:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Toggle Follow (Optimized) ---
export const toggleFollowClub = async (req: AuthenticatedRequest, res: Response) => {
  const { clubId } = req.params;
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const numericId = Number(clubId);
    if (isNaN(numericId)) {
        return res.status(400).json({ message: "Invalid Club ID format" });
    }

    // Check if user is ALREADY following
    const followingList = (user.following as number[]) || [];
    const isFollowing = followingList.includes(numericId);

    if (isFollowing) {
      // UNFOLLOW: Remove from User list, Decrement Club count
      await Promise.all([
        User.findByIdAndUpdate(userId, { $pull: { following: numericId } }),
        Club.findOneAndUpdate({ clubId: numericId }, { $inc: { followers: -1 } })
      ]);
    } else {
      // FOLLOW: Add to User list, Increment Club count
      await Promise.all([
        User.findByIdAndUpdate(userId, { $addToSet: { following: numericId } }),
        Club.findOneAndUpdate({ clubId: numericId }, { $inc: { followers: 1 } })
      ]);
    }

    // Fetch fresh list to update frontend state immediately
    const updatedUser = await User.findById(userId).select('following');
    res.json({ following: updatedUser?.following || [] });

  } catch (error) {
    console.error("Toggle Follow Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};