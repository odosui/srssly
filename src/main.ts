import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import usersRouter from "./routes/users";
import feedsRouter from "./routes/feeds";
import entriesRouter from "./routes/entries";

dotenv.config();

const app = express();
const port = process.env["PORT"] || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client/public (works in both dev and prod)
const publicPath = path.join(__dirname, "../client/public");
app.use("/static", express.static(publicPath));

// Routes
app.use("/api/users", usersRouter);
app.use("/api/feeds", feedsRouter);
app.use("/api/entries", entriesRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve static files from the React app in production
if (process.env["NODE_ENV"] === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Handle React routing, return all requests to React app
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
