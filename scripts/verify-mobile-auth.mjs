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

const assertions = [
  ["auth screen exists", contents.auth.includes("export default function AuthScreen")],
  ["sign-in form uses context action", contents.auth.includes("await signIn(cleanEmail, password)")],
  ["sign-up form uses context action", contents.auth.includes("await signUp(cleanEmail, password)")],
  ["tabs are guarded by session", contents.tabs.includes("if (!session) return <Redirect href=\"/auth\" />")],
  ["password auth endpoint is present", contents.supabase.includes("token?grant_type=password")],
  ["refresh auth endpoint is present", contents.supabase.includes("token?grant_type=refresh_token")],
  ["player provisioning uses official RPC", contents.supabase.includes("ensure_player_row")],
  ["Google account selector is exposed", contents.auth.includes('testID="auth-google"') && contents.auth.includes("signInWithGoogle")],
  ["Supabase Google OAuth flow is present", contents.supabase.includes("provider=google") && contents.supabase.includes("openAuthSessionAsync")],
  ["auth form uses keyboard-aware scrolling", contents.auth.includes("KeyboardAwareScrollViewCompat") && contents.auth.includes("bottomOffset={24}"),],
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