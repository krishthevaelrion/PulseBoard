import dotenv from "dotenv";
dotenv.config();
console.log("Checking Environment Variables in server.ts...");
console.log("Token starts with:", process.env.HUGGING_FACE_TOKEN ? process.env.HUGGING_FACE_TOKEN.substring(0, 5) : "NOT FOUND");
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import router from "../src/routes/auth.routes";
import clubRoutes from "./routes/club.routes";
import eventRoutes from "./routes/event.routes";
import userRoutes from "./routes/user.routes";
import testRoutes from "./routes/test.routes";
import categoryRoutes from "./routes/category.routes";
import mailRoutes from "./routes/mail.routes";



const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});


app.use("/api/auth", router);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mails", mailRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/mails", mailRoutes);
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
