import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import usersRouter from "./routes/users";
import feedsRouter from "./routes/feeds";

dotenv.config();

const app = express();
const port = process.env["PORT"] || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/users", usersRouter);
app.use("/feeds", feedsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
