import { Router } from "express";
import { sendExpoPush } from "../services/push.service";
import User, { IUser } from "../models/User.model";

const router = Router();

router.post("/test-push", async (req, res) => {
  const user = await User.findOne<IUser>({
    expoPushToken: { $exists: true },
  });

  // 🔒 SAFETY GUARD (required for TS)
  if (!user || !user.expoPushToken) {
    return res.status(404).json({
      error: "No user with push token",
    });
  }

  await sendExpoPush(
    user.expoPushToken,
    "PulseBoard 🔔",
    "This is your first real push notification",
    { screen: "/tabs" }
  );

  res.json({ success: true });
});

export default router;