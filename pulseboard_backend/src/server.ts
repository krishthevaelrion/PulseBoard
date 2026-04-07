import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import router from "./routes/auth.routes";
import clubRoutes from "./routes/club.routes";
import eventRoutes from "./routes/event.routes";
import userRoutes from "./routes/user.routes";
import testRoutes from "./routes/test.routes";
import emailRoutes from "./routes/email.routes";
import personalEventRoutes from "./routes/personalEvent.routes";
import categoryRoutes from "./routes/category.routes";
import mailRoutes from "./routes/mail.routes";
import calendarRoutes from "./routes/calendar.routes";
import lhcRoutes from "./routes/lhc.routes";

import { startGmailWatcher } from "./services/gmailWatcher.service";
import { startReminderScheduler } from "./services/reminderScheduler.service";
import { initCronJobs } from './jobs/cron';
const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", router);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/personal-events", personalEventRoutes);
app.use("/api/mails", mailRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/lhc", lhcRoutes);
app.use("/api", testRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ GLOBAL_ERROR_CAUGHT:", err.stack || err);
  res.status(500).json({ message: 'Internal Server Error', error: (err as any).message });
});

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ MongoDB connected");
    
    initCronJobs(); 
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  startGmailWatcher(300_000);
  startReminderScheduler();
});
