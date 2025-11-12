import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import UserRoutes from "./routes/User.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", UserRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "FitTrack serverless API is running.",
  });
});

app.get("/test", (req, res) => {
  res.send("Test endpoint is working!");
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({
    success: false,
    status,
    message,
  });
});

export default app;

