import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import router from "../src/routes/auth.routes";
import clubRoutes from "./routes/club.routes";
import eventRoutes from "./routes/event.routes";
import userRoutes from "./routes/user.routes";
import testRoutes from "./routes/test.routes";
import emailRoutes from "./routes/email.routes";
import personalEventRoutes from "./routes/personalEvent.routes";
import categoryRoutes from "./routes/category.routes";
import mailRoutes from "./routes/mail.routes";
import calendarRoutes from "./routes/calendar.routes";
import { startGmailWatcher } from "./services/gmailWatcher.service";
import { startReminderScheduler } from "./services/reminderScheduler.service";
import { initCronJobs } from './jobs/cron';
const app = express();

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
app.use("/api", testRoutes);

// --- DATABASE & SERVER START ---
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ MongoDB connected");
    
    // 1. Start the cron job scheduler once DB is ready
    initCronJobs(); 
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // 2. Start your background services
  startGmailWatcher(300_000);
  startReminderScheduler();
});
