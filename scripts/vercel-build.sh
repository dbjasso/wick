#!/bin/sh
set -e

# ponytail: Vercel Postgres expone POSTGRES_URL_NON_POOLING; a mano suele fallar
# si DIRECT_URL no es una URL postgres real (P1013 "scheme not recognized").
is_pg_url() {
  case "$1" in
    postgresql://* | postgres://*) return 0 ;;
    *) return 1 ;;
  esac
}

MIGRATE_URL=""
if is_pg_url "$DIRECT_URL"; then
  MIGRATE_URL="$DIRECT_URL"
elif is_pg_url "$POSTGRES_URL_NON_POOLING"; then
  MIGRATE_URL="$POSTGRES_URL_NON_POOLING"
  echo "vercel-build: using POSTGRES_URL_NON_POOLING for migrate deploy"
fi

if [ -n "$MIGRATE_URL" ]; then
  export DIRECT_URL="$MIGRATE_URL"
  npx prisma migrate deploy
else
  echo "vercel-build: ERROR — no valid postgres URL for migrations."
  echo "  Supabase: set DIRECT_URL to the *direct* host (db.<ref>.supabase.co:5432), not the pooler."
  echo "  Vercel Postgres: ensure POSTGRES_URL_NON_POOLING is linked, or set DIRECT_URL to its value."
  exit 1
fi

npm run build
