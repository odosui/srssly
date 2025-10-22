import pool from "../config/database";

export interface Entry {
  id: number;
  feed_id: number;
  title: string;
  url: string;
  author: string | null;
  entry_id: string;
  summary: string | null;
  published: Date;
  updated: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserEntry {
  id: number;
  entry_id: number;
  user_id: number;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EntryWithFeed extends Entry {
  feed: {
    id: number;
    title: string;
    icon_url: string | null;
  };
}

export class EntryModel {
  /**
   * Find an entry by ID
   */
  static async findById(id: number): Promise<Entry | null> {
    const result = await pool.query<Entry>(
      "SELECT * FROM entries WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] || null;
  }

  static async getUserFeed(userId: number): Promise<EntryWithFeed[]> {
    const result = await pool.query<EntryWithFeed>(
      `SELECT
        entries.*,
        feeds.id as feed_id,
        feeds.title as feed_title,
        feeds.icon_url as feed_icon_url
       FROM entries
       LEFT JOIN user_entries ON (user_entries.entry_id = entries.id AND user_entries.user_id = $1)
       INNER JOIN feeds ON feeds.id = entries.feed_id
       INNER JOIN user_feeds ON user_feeds.feed_id = feeds.id
       WHERE user_feeds.user_id = $1
         AND (user_entries.id IS NULL OR user_entries.read = false)
       ORDER BY entries.published DESC
       LIMIT 200`,
      [userId],
    );

    // Transform the flat result into nested structure
    return result.rows.map((row: any) => ({
      id: row.id,
      feed_id: row.feed_id,
      title: row.title,
      url: row.url,
      author: row.author,
      entry_id: row.entry_id,
      summary: row.summary,
      published: row.published,
      updated: row.updated,
      created_at: row.created_at,
      updated_at: row.updated_at,
      feed: {
        id: row.feed_id,
        title: row.feed_title,
        icon_url: row.feed_icon_url,
      },
    }));
  }

  /**
   * Find or create a user_entry record (marks as read)
   */
  static async findOrCreateUserEntry(
    userId: number,
    entryId: number,
  ): Promise<UserEntry> {
    // Try to find existing
    const existing = await pool.query<UserEntry>(
      "SELECT * FROM user_entries WHERE user_id = $1 AND entry_id = $2 LIMIT 1",
      [userId, entryId],
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    // Create new (read defaults to true)
    const result = await pool.query<UserEntry>(
      `INSERT INTO user_entries (user_id, entry_id, read, created_at, updated_at)
       VALUES ($1, $2, true, NOW(), NOW())
       RETURNING *`,
      [userId, entryId],
    );
    return result.rows[0];
  }

  /**
   * Delete user_entry records (marks as unread)
   */
  static async deleteUserEntry(userId: number, entryId: number): Promise<void> {
    await pool.query(
      "DELETE FROM user_entries WHERE user_id = $1 AND entry_id = $2",
      [userId, entryId],
    );
  }

  /**
   * Bulk upsert user_entries to mark multiple entries as read
   */
  static async markEntriesAsRead(
    userId: number,
    entryIds: number[],
  ): Promise<void> {
    if (entryIds.length === 0) return;

    // Build the VALUES clause for upsert
    const values: any[] = [];
    const placeholders: string[] = [];

    entryIds.forEach((entryId, index) => {
      const baseIndex = index * 2;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, true, NOW(), NOW())`,
      );
      values.push(userId, entryId);
    });

    const query = `
      INSERT INTO user_entries (user_id, entry_id, read, created_at, updated_at)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (user_id, entry_id)
      DO UPDATE SET read = true, updated_at = NOW()
    `;

    await pool.query(query, values);
  }

  /**
   * Get entry IDs that actually exist in the database
   */
  static async getExistingEntryIds(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    const result = await pool.query<{ id: number }>(
      `SELECT id FROM entries WHERE id IN (${placeholders})`,
      ids,
    );

    return result.rows.map((row) => row.id);
  }

  /**
   * Find an entry by entry_id (unique identifier from the feed)
   */
  static async findByEntryId(entryId: string): Promise<Entry | null> {
    const result = await pool.query<Entry>(
      "SELECT * FROM entries WHERE entry_id = $1 LIMIT 1",
      [entryId],
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new entry
   */
  static async create(
    feedId: number,
    entryId: string,
    title: string,
    url: string,
    author: string | null,
    published: Date,
    summary: string | null,
  ): Promise<Entry> {
    const result = await pool.query<Entry>(
      `INSERT INTO entries (feed_id, entry_id, title, url, author, published, summary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [feedId, entryId, title, url, author, published, summary],
    );
    return result.rows[0];
  }
}
