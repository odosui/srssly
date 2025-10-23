#!/bin/sh
set -e

case "$1" in
  start)
    echo "Starting application..."
    exec node dist/main.js
    ;;
  init-db)
    echo "Initializing database..."
    exec tsx scripts/init-db.ts
    ;;
  fetch-entries)
    echo "Fetching feed entries..."
    exec tsx scripts/fetch-entries.ts
    ;;
  *)
    # Allow running arbitrary commands
    exec "$@"
    ;;
esac
