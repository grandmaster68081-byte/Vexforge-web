#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d /tmp/vexforge-v7-pg.XXXXXX)"
PORT="$((54000 + ($$ % 1000)))"

cleanup() {
  if [[ -d "$TMP/data" ]]; then
    pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

initdb -D "$TMP/data" -A trust --no-locale >/dev/null
pg_ctl -D "$TMP/data" -l "$TMP/postgres.log" \
  -o "-h 127.0.0.1 -k $TMP -p $PORT" -w start >/dev/null

PSQL=(psql -h "$TMP" -p "$PORT" -U "$(id -un)" -d postgres -v ON_ERROR_STOP=1)
"${PSQL[@]}" -f "$ROOT/verification/v7-turn-combat-fixture.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261006220000_vexforge_universal_turn_combat_v7.sql"
"${PSQL[@]}" -f "$ROOT/verification/v7-turn-combat-test.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261006230000_vexforge_turn_combat_v7_pvp_rooms.sql"
"${PSQL[@]}" -f "$ROOT/verification/v7-pvp-turn-combat-test.sql"

printf 'V7 local PostgreSQL training and PvP verification passed. No remote database was used.\n'
