import pool from "../src/config/database";

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log("Starting database initialization...");

    // Drop existing tables (in reverse dependency order)
    await client.query("DROP TABLE IF EXISTS user_entries CASCADE");
    await client.query("DROP TABLE IF EXISTS entries CASCADE");
    await client.query("DROP TABLE IF EXISTS user_feeds CASCADE");
    await client.query("DROP TABLE IF EXISTS feeds CASCADE");
    await client.query("DROP TABLE IF EXISTS auth_tokens CASCADE");
    await client.query("DROP TABLE IF EXISTS users CASCADE");

    console.log("Dropped existing tables");

    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created users table");

    // Create auth_tokens table
    await client.query(`
      CREATE TABLE auth_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        kind VARCHAR(50) NOT NULL CHECK (kind IN ('regular', 'refresh')),
        expire_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created auth_tokens table");

    // Create feeds table
    await client.query(`
      CREATE TABLE feeds (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        icon_url VARCHAR(500),
        url VARCHAR(500) UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Created feeds table");

    // Create user_feeds table
    await client.query(`
      CREATE TABLE user_feeds (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, feed_id)
      )
    `);
    console.log("Created user_feeds table");

    // Create entries table
    await client.query(`
      CREATE TABLE entries (
        id SERIAL PRIMARY KEY,
        feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        url VARCHAR(1000) NOT NULL,
        author VARCHAR(255),
        entry_id VARCHAR(500) NOT NULL,
        summary TEXT,
        published TIMESTAMP NOT NULL,
        updated TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(feed_id, entry_id)
      )
    `);
    console.log("Created entries table");

    // Create user_entries table
    await client.query(`
      CREATE TABLE user_entries (
        id SERIAL PRIMARY KEY,
        entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, entry_id)
      )
    `);
    console.log("Created user_entries table");

    // Create indices for better performance
    await client.query("CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id)");
    await client.query("CREATE INDEX idx_auth_tokens_token ON auth_tokens(token)");
    await client.query("CREATE INDEX idx_auth_tokens_expire_at ON auth_tokens(expire_at)");
    console.log("Created auth_tokens indices");

    await client.query("CREATE INDEX idx_user_feeds_user_id ON user_feeds(user_id)");
    await client.query("CREATE INDEX idx_user_feeds_feed_id ON user_feeds(feed_id)");
    console.log("Created user_feeds indices");

    await client.query("CREATE INDEX idx_entries_feed_id ON entries(feed_id)");
    await client.query("CREATE INDEX idx_entries_published ON entries(published DESC)");
    console.log("Created entries indices");

    await client.query("CREATE INDEX idx_user_entries_user_id ON user_entries(user_id)");
    await client.query("CREATE INDEX idx_user_entries_entry_id ON user_entries(entry_id)");
    await client.query("CREATE INDEX idx_user_entries_read ON user_entries(read)");
    console.log("Created user_entries indices");

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
initializeDatabase().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
