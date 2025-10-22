# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack RSS reader application with:
- **Backend**: Express.js + TypeScript API server
- **Frontend**: React client (in `client/` directory)
- **Database**: PostgreSQL
- **Authentication**: Token-based auth with regular and refresh tokens

## Development Commands

### Running the Application

```bash
# Run both server and client in development mode
npm run dev

# Run server only (with hot reload)
npm run dev:server

# Run client only (development mode)
npm run dev:client

# Build everything (server + client)
npm run build

# Build server only (TypeScript compilation)
npm run build:server

# Build client only
npm run build:client

# Start production server
npm start
```

### Database Management

```bash
# Initialize/reset database schema
tsx scripts/init-db.ts

# Fetch entries for all feeds (populate entries table)
tsx scripts/fetch-entries.ts
```

## Architecture

### Database Schema

The application uses a relational PostgreSQL schema with these core tables:

- **users**: User accounts with email and password_hash
- **auth_tokens**: JWT-like tokens (regular: 1 day, refresh: 30 days)
- **feeds**: RSS/Atom feeds with title, url, and icon_url
- **user_feeds**: Many-to-many relationship between users and feeds (subscriptions)
- **entries**: Individual feed items/articles
- **user_entries**: Tracks read/unread status per user per entry

Key relationships:
- Users subscribe to feeds via `user_feeds` (many-to-many)
- Entries belong to feeds and are marked read/unread via `user_entries`
- Auth tokens support both regular (short-lived) and refresh (long-lived) tokens

### API Routes

The API is structured with three main route groups:

**Users** (`/api/users`):
- `POST /api/users` - Create new user account
- `POST /api/users/login` - Login (returns regular_token + refresh_token)
- `POST /api/users/refresh` - Refresh token pair (requires refresh_token)

**Feeds** (`/api/feeds`):
- `POST /api/feeds` - Subscribe to a feed (accepts URL, auto-discovers RSS/Atom)
- `GET /api/feeds` - List user's subscribed feeds
- `DELETE /api/feeds/:id` - Unsubscribe from feed

**Entries** (`/api/entries`):
- `GET /api/entries` - Get user's feed (unread entries, limit 200)
- `POST /api/entries/:id/read` - Mark entry as read
- `POST /api/entries/:id/unread` - Mark entry as unread
- `POST /api/entries/read_all` - Bulk mark entries as read (accepts comma-separated IDs)

### Authentication Flow

All feed and entry endpoints require authentication via `authenticateUser` middleware:
- Expects `Authorization: Bearer <token>` header
- Only accepts "regular" tokens (not refresh tokens)
- Attaches `currentUser` to the request object

Token lifecycle:
1. Login returns both regular_token and refresh_token
2. Use regular_token for API requests
3. When regular_token expires, use refresh_token to get a new token pair
4. Old refresh_token is invalidated when new pair is generated

### Feed Discovery & Parsing

When subscribing to a feed via `POST /api/feeds`:

1. URL validation using `isValidUrl()` utility
2. Fetches the URL (max 10s timeout, follows up to 5 redirects)
3. If HTML is returned:
   - Searches for `<link>` tags with type "application/rss+xml" or "application/atom+xml"
   - Returns multiple options if found, or automatically subscribes if only one
4. If XML is returned, parses directly as RSS/Atom using rss-parser
5. Creates feed record and associates with user via `user_feeds`

Feed parsing extracts:
- Feed metadata: title, icon_url (from feed.image.url)
- Entry data: entryId (guid/link/id), title, url, author, published date, summary

### Models Pattern

Each model (User, Feed, Entry) follows a static method pattern:
- `findById()`, `findByX()` - Lookup methods
- `create()` - Insert records
- `findOrCreate()` - Upsert pattern for associations
- Query results are strongly typed using TypeScript interfaces

Special model methods:
- `FeedModel.fetchEntries(feedId)` - Fetches and parses feed XML, creates new entries
- `EntryModel.getUserFeed(userId)` - Returns unread entries for user's subscribed feeds
- `EntryModel.markEntriesAsRead()` - Bulk insert/update for read status

### TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true` with all strictness flags enabled
- `noImplicitAny`, `strictNullChecks`, `noImplicitReturns`
- `noUncheckedIndexedAccess` - requires null checks for array/object access
- Compiles `src/` to `dist/` using CommonJS modules

### Production Deployment

In production mode (`NODE_ENV=production`):
- Server serves static files from `client/dist`
- All non-API routes fall back to React app's `index.html` for client-side routing
- Docker support available via `Dockerfile` and `docker-compose.yml`

## Environment Variables

Required environment variables (see `.env.example`):

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prss_server_development
DB_USERNAME=
DB_PASSWORD=
```

## Development Notes

- The server uses `tsx watch` for hot reloading during development
- Database connection pool is initialized on startup in `src/config/database.ts`
- Feed fetching has built-in error handling (returns null on failure)
- Entry IDs are globally unique (feed_id + entry_id composite unique constraint)
- Read/unread status is tracked by presence in `user_entries` table (read=true means read)
