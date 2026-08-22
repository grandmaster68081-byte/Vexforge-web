import { readFile } from "node:fs/promises";

const [migration, emitter, app, fusion, battle, quests] = await Promise.all([
  readFile("supabase/migrations/0039_ve_vis_6_game_loop_telemetry.sql", "utf8"),
  readFile("src/lib/telemetry.ts", "utf8"),
  readFile("src/App.tsx", "utf8"),
  readFile("src/routes/FusionRoute.tsx", "utf8"),
  readFile("src/components/battle/BattleResultScreen.tsx", "utf8"),
  readFile("src/routes/QuestsRoute.tsx", "utf8"),
]);

const requiredEvents = [
  "session_start",
  "forge_action",
  "combat_resolved",
  "reward_claimed",
  "return_visit",
];

for (const eventKey of requiredEvents) {
  if (!emitter.includes(`"${eventKey}"`)) {
    throw new Error(`Telemetry emitter missing canonical event: ${eventKey}`);
  }
  if (!migration.includes(`'${eventKey}'`)) {
    throw new Error(`Telemetry migration missing canonical event: ${eventKey}`);
  }
}

const consumerChecks = [
  ["src/App.tsx", app, "trackSessionEntry"],
  ["src/routes/FusionRoute.tsx", fusion, 'emitTelemetry("forge_action"'],
  ["src/components/battle/BattleResultScreen.tsx", battle, 'emitTelemetry("combat_resolved"'],
  ["src/routes/QuestsRoute.tsx", quests, 'emitTelemetry("reward_claimed"'],
];
for (const [file, source, marker] of consumerChecks) {
  if (!source.includes(marker)) throw new Error(`Telemetry consumer missing in ${file}: ${marker}`);
}

if (!emitter.includes("getSession") || !emitter.includes("vexforge_telemetry_events")) {
  throw new Error("Telemetry emitter must require an authenticated session and write to the canonical table");
}
if (emitter.includes("user_id:") || emitter.includes("userId:")) {
  throw new Error("Telemetry emitter must never choose or send user_id");
}
if (!migration.includes("auth.uid() = user_id") || !migration.includes("revoke all on table public.vexforge_telemetry_events from public, anon, authenticated")) {
  throw new Error("Telemetry migration is missing player isolation or strict grants");
}
if (!migration.includes("security definer") || !migration.includes("set search_path = public, pg_catalog")) {
  throw new Error("Telemetry coverage function must be a hardened security definer");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rscuzqnfccqvltkdcdny.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3eGRSpvxptO09eQQzpxysQ_Imq8zi58";
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/vexforge_telemetry_coverage`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  },
});

if (!response.ok) {
  throw new Error(`Live telemetry coverage request failed: HTTP ${response.status}`);
}

const coverage = await response.json();
if (!Array.isArray(coverage) || coverage.length !== requiredEvents.length) {
  throw new Error(`Live telemetry coverage must return exactly ${requiredEvents.length} canonical events`);
}

const counts = new Map(coverage.map((row) => [row.event_key, Number(row.event_count)]));
for (const eventKey of requiredEvents) {
  if (!counts.has(eventKey)) throw new Error(`Live telemetry coverage missing event: ${eventKey}`);
  if ((counts.get(eventKey) ?? 0) < 1) {
    throw new Error(`Live telemetry coverage has no real event for: ${eventKey}`);
  }
}

console.log(`Telemetry verified: ${requiredEvents.length}/${requiredEvents.length} canonical events with live coverage.`);