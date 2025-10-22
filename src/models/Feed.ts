import pool from "../config/database";
import { fetchFeed, parseXmlWithEntries } from "../utils/feeds";
import { EntryModel } from "./Entry";

export interface Feed {
  id: number;
  title: string;
  icon_url: string | null;
  url: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserFeed {
  id: number;
  user_id: number;
  feed_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface FeedOption {
  title: string | null;
  url: string;
}

export class FeedModel {
  /**
   * Find a feed by URL
   */
  static async findByUrl(url: string): Promise<Feed | null> {
    const result = await pool.query<Feed>(
      "SELECT * FROM feeds WHERE url = $1 LIMIT 1",
      [url],
    );
    return result.rows[0] || null;
  }

  /**
   * Find a feed by ID
   */
  static async findById(id: number): Promise<Feed | null> {
    const result = await pool.query<Feed>(
      "SELECT * FROM feeds WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new feed
   */
  static async create(
    title: string,
    url: string,
    iconUrl: string | null = null,
  ): Promise<Feed> {
    const result = await pool.query<Feed>(
      `INSERT INTO feeds (title, url, icon_url, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [title, url, iconUrl],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Failed to create feed");
    }
    return row;
  }

  /**
   * Get all feeds for a user (ordered by subscription date, descending)
   */
  static async getUserFeeds(userId: number): Promise<Feed[]> {
    const result = await pool.query<Feed>(
      `SELECT feeds.* FROM feeds
       INNER JOIN user_feeds ON user_feeds.feed_id = feeds.id
       WHERE user_feeds.user_id = $1
       ORDER BY user_feeds.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Find or create a UserFeed association
   */
  static async findOrCreateUserFeed(
    userId: number,
    feedId: number,
  ): Promise<UserFeed> {
    // Try to find existing
    const existing = await pool.query<UserFeed>(
      "SELECT * FROM user_feeds WHERE user_id = $1 AND feed_id = $2 LIMIT 1",
      [userId, feedId],
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    // Create new
    const result = await pool.query<UserFeed>(
      `INSERT INTO user_feeds (user_id, feed_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [userId, feedId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Failed to create user_feed");
    }
    return row;
  }

  /**
   * Find a UserFeed association
   */
  static async findUserFeed(
    userId: number,
    feedId: number,
  ): Promise<UserFeed | null> {
    const result = await pool.query<UserFeed>(
      "SELECT * FROM user_feeds WHERE user_id = $1 AND feed_id = $2 LIMIT 1",
      [userId, feedId],
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a UserFeed association (unsubscribe)
   */
  static async deleteUserFeed(userId: number, feedId: number): Promise<void> {
    await pool.query(
      "DELETE FROM user_feeds WHERE user_id = $1 AND feed_id = $2",
      [userId, feedId],
    );
  }

  static async fetchEntries(feedId: number): Promise<{
    newEntries: number;
    totalEntries: number;
  }> {
    // Get the feed
    const feed = await this.findById(feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    // Fetch the feed XML
    const response = await fetchFeed(feed.url);
    if (!response) {
      throw new Error("Failed to fetch feed");
    }

    // Parse the XML with entries
    const parsedFeed = await parseXmlWithEntries(response.data);
    if (!parsedFeed) {
      throw new Error("Failed to parse feed XML");
    }

    let newEntriesCount = 0;
    const totalEntries = parsedFeed.entries.length;

    // Process each entry
    for (const entry of parsedFeed.entries) {
      // Check if entry already exists
      const existingEntry = await EntryModel.findByEntryId(entry.entryId);

      if (!existingEntry) {
        // Create new entry
        await EntryModel.create(
          feedId,
          entry.entryId,
          entry.title,
          entry.url,
          entry.author,
          entry.published,
          entry.summary,
        );
        newEntriesCount++;
      }
    }

    return {
      newEntries: newEntriesCount,
      totalEntries,
    };
  }
}
