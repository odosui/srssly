import { Response, Router } from "express";
import { AuthRequest, authenticateUser } from "../middleware/auth";
import { Feed, FeedModel } from "../models/Feed";
import { fetchFeed, findFeedsInHtml, parseXml } from "../utils/feeds";
import { isValidUrl } from "../utils/urls";

const router = Router();

// POST /feeds - Subscribe to a feed
router.post(
  "/",
  authenticateUser,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      let { url } = req.body as { url?: string };

      if (!url) {
        res.status(400).json({ error: "URL is blank" });
        return;
      }

      if (!isValidUrl(url)) {
        res.status(400).json({ error: "URL is not valid" });
        return;
      }

      // Check if feed already exists
      let feed = await FeedModel.findByUrl(url);
      if (feed) {
        await FeedModel.findOrCreateUserFeed(req.currentUser!.id, feed.id);
        res.json(toJson(feed));
        return;
      }

      const response = await fetchFeed(url);
      if (!response) {
        res.status(400).json({ error: "Not able to find feed" });
        return;
      }

      // Check if response is HTML
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("text/html")) {
        const options = findFeedsInHtml(url, response.data);

        if (options.length === 0) {
          res.status(400).json({ error: "Not able to find feed" });
          return;
        } else if (options.length === 1 && options[0]) {
          // Single feed found, fetch and parse it
          url = options[0].url;
          feed = await FeedModel.findByUrl(url);

          if (feed) {
            await FeedModel.findOrCreateUserFeed(req.currentUser!.id, feed.id);
            res.json(toJson(feed));
            return;
          }

          const response = await fetchFeed(url);
          if (!response) {
            res.status(400).json({ error: "Not able to find feed" });
            return;
          }
        } else {
          // Multiple feeds found, return options to user
          res.json({ options });
          return;
        }
      }

      // Parse as RSS/Atom feed
      feed = await createFeedFromXml(url, response.data);
      if (!feed) {
        res.status(400).json({ error: "Not able to parse feed" });
        return;
      }

      await FeedModel.findOrCreateUserFeed(req.currentUser!.id, feed!.id);
      res.json(toJson(feed));
    } catch (error) {
      console.error("Error creating feed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /feeds - List user's feeds
router.get(
  "/",
  authenticateUser,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const feeds = await FeedModel.getUserFeeds(req.currentUser!.id);
      res.json(feeds.map(toJson));
    } catch (error) {
      console.error("Error fetching feeds:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// DELETE /feeds/:id - Unsubscribe from feed
router.delete(
  "/:id",
  authenticateUser,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = req.params["id"];

      if (!id) {
        res.status(400).json({ error: "Feed ID is required" });
        return;
      }

      const feedId = parseInt(id, 10);

      if (isNaN(feedId)) {
        res.status(400).json({ error: "Invalid feed ID" });
        return;
      }

      const feed = await FeedModel.findById(feedId);
      if (!feed) {
        res.status(404).json({ error: "Feed not found" });
        return;
      }

      const userFeed = await FeedModel.findUserFeed(
        req.currentUser!["id"],
        feedId,
      );
      if (userFeed) {
        await FeedModel.deleteUserFeed(req.currentUser!["id"], feedId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting feed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;

// Helper function to serialize feed to JSON
function toJson(feed: Feed) {
  return {
    id: feed.id,
    title: feed.title,
    icon_url: feed.icon_url,
    url: feed.url,
  };
}

// Helper function to parse feed XML and create feed record
async function createFeedFromXml(
  url: string,
  xml: string,
): Promise<Feed | null> {
  const result = await parseXml(xml);

  if (!result) {
    return null;
  }

  const { title, iconUrl } = result;

  try {
    const feed = await FeedModel.create(title, url, iconUrl);
    return feed;
  } catch (error) {
    console.error("Error parsing feed XML:", error);
    return null;
  }
}
