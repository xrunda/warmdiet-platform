#!/bin/sh
# WarmDiet open-source demo startup script.

set -e

export NODE_ENV=production
export PORT=${PORT:-4000}
export DATABASE_PATH=${DATABASE_PATH:-/data/warmdiet.db}

echo "[start] WarmDiet API listening on port: $PORT"
echo "[start] Database path: $DATABASE_PATH"

exec npx tsx server/src/index.ts
