import express, { Response } from "express";
import { AuthRequest, authenticateUser } from "../middleware/auth";
import { EntryModel } from "../models/Entry";

const router = express.Router();

/**
 * GET /entries
 * Get user's feed (unread entries from subscribed feeds)
 */
router.get("/", authenticateUser, async (req: AuthRequest, res: Response) => {
  const userId = req.currentUser?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const entries = await EntryModel.getUserFeed(userId);

    const jsonEntries = entries.map((e) => ({
      id: e.id,
      title: e.title,
      url: e.url,
      published: e.published,
      summary: e.summary,
      feed: {
        id: e.feed.id,
        title: e.feed.title,
        icon_url: e.feed.icon_url,
      },
    }));

    res.json(jsonEntries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /entries/:id/read
 * Mark an entry as read
 */
router.post(
  "/:id/read",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    const userId = req.currentUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const entryId = parseInt(req.params?.["id"] ?? "0", 10);

    if (!entryId || isNaN(entryId)) {
      res.status(400).json({ error: "Invalid entry ID" });
      return;
    }

    try {
      // Check if entry exists
      const entry = await EntryModel.findById(entryId);
      if (!entry) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }

      // Mark as read (create user_entry)
      await EntryModel.findOrCreateUserEntry(userId, entryId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking entry as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /entries/:id/unread
 * Mark an entry as unread
 */
router.post(
  "/:id/unread",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    const userId = req.currentUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const entryId = parseInt(req.params?.["id"] ?? "0", 10);

    if (!entryId || isNaN(entryId)) {
      res.status(400).json({ error: "Invalid entry ID" });
      return;
    }

    try {
      // Check if entry exists
      const entry = await EntryModel.findById(entryId);
      if (!entry) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }

      // Mark as unread (delete user_entry)
      await EntryModel.deleteUserEntry(userId, entryId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking entry as unread:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /entries/read_all
 * Bulk mark entries as read
 * Expects: { ids: "1,2,3" } or ?ids=1,2,3
 */
router.post(
  "/read_all",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    const userId = req.currentUser?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const idsParam = req.body.ids;

    if (!idsParam || typeof idsParam !== "string") {
      res.status(400).json({ error: "Missing or invalid ids parameter" });
      return;
    }

    // Parse comma-separated IDs
    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      res.json({ success: true });
      return;
    }

    try {
      // Verify entries exist and get valid IDs
      const validIds = await EntryModel.getExistingEntryIds(ids);

      // Bulk mark as read
      await EntryModel.markEntriesAsRead(userId, validIds);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking entries as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
