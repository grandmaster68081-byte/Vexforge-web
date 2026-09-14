import { readFile } from "node:fs/promises";

const files = {
  auth: "mobile/app/auth.tsx",
  tabs: "mobile/app/(tabs)/_layout.tsx",
  root: "mobile/app/_layout.tsx",
  supabase: "mobile/lib/supabase.ts",
};

const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, "utf8")])),
);
const authAsset = await readFile("mobile/assets/images/auth-reference-scene.png");
const authAssetIsTargetCanvas =
  authAsset.readUInt32BE(0) === 0x89504e47 &&
  authAsset.readUInt32BE(16) === 1080 &&
  authAsset.readUInt32BE(20) === 2340 &&
  authAsset[25] === 2;

const assertions = [
  ["auth screen exists", contents.auth.includes("export default function AuthScreen")],
  ["auth is a programmatic surface without a background skin", contents.auth.includes('testID="auth-reference-scene"') && !contents.auth.includes("auth-reference-scene.png") && !contents.auth.includes("ImageBackground")],
  ["sign-in form uses context action", contents.auth.includes("await signIn(normalizedEmail, password, rememberSession)")],
  ["sign-up form uses context action", contents.auth.includes("const createdSession = await signUp(normalizedEmail, password)")],
  ["tabs are guarded by session", contents.tabs.includes("if (!session) return <Redirect href=\"/auth\" />")],
  ["password auth endpoint is present", contents.supabase.includes("token?grant_type=password")],
  ["refresh auth endpoint is present", contents.supabase.includes("token?grant_type=refresh_token")],
  ["player provisioning uses official RPC", contents.supabase.includes("ensure_player_row")],
  ["Google account selector is exposed", contents.auth.includes('testID="auth-google"') && contents.auth.includes("socialLogin('google')")],
  ["Supabase Google OAuth flow is present", contents.supabase.includes("provider=' + provider") && contents.supabase.includes("openAuthSessionAsync")],
  ["auth form uses keyboard-aware scrolling", contents.auth.includes("KeyboardAwareScrollViewCompat") && contents.auth.includes("bottomOffset={24}"),],
  ["auth exposes a live Nexus gate state", contents.auth.includes('testID="auth-status-rail"') && contents.auth.includes("PUERTA DEL NEXUS") && contents.auth.includes("CONFIRMACIÓN PENDIENTE")],
  ["auth actions expose press depth", contents.auth.includes("translateY: pressed ? 1 : 0") && contents.auth.includes("translateY: pressed ? 2 : 0")],
  ["auth stack header is hidden", contents.root.includes('<Stack.Screen name="auth" options={{ headerShown: false')],
  ["tab bar hides while keyboard is open", contents.tabs.includes("tabBarHideOnKeyboard: true")],
  ["no emoji characters in auth UI", !/[\u{1F000}-\u{1FAFF}]/u.test(contents.auth)],
];

const failures = assertions.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length > 0) {
  console.error(`Mobile auth verification failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`Mobile auth verification OK: ${assertions.length}/${assertions.length} checks`);