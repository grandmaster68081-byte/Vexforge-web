import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const unity = path.join(root, "unity");
const requiredFiles = [
  "ProjectSettings/ProjectVersion.txt",
  "Packages/manifest.json",
  "Packages/packages-lock.json",
  "ProjectSettings/ProjectSettings.asset",
  "ProjectSettings/EditorBuildSettings.asset",
  "Assets/Scenes/VexforgeBootstrap.unity",
  "Assets/Resources/VexforgeEnvironment.json",
  "Assets/Scripts/Core/VexforgeApp.cs",
  "Assets/Scripts/Backend/SupabaseClient.cs",
  "Assets/Scripts/Backend/VexforgeRepository.cs",
  "Assets/Scripts/GameState/GameStateStore.cs",
  "Assets/Scripts/UI/GameShellController.cs",
];

const fail = (message) => {
  console.error(`UNITY VERIFY FAILED: ${message}`);
  process.exitCode = 1;
};

for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(unity, relative))) fail(`missing ${relative}`);
}

const version = fs.readFileSync(path.join(unity, "ProjectSettings/ProjectVersion.txt"), "utf8");
if (!version.includes("6000.3.0f1")) fail("Unity target is not declared as 6000.3.0f1");

const projectSettings = fs.readFileSync(path.join(unity, "ProjectSettings/ProjectSettings.asset"), "utf8");
if (!projectSettings.includes("com.vexforge.android")) fail("Android application id is missing");

const environment = fs.readFileSync(path.join(unity, "Assets/Resources/VexforgeEnvironment.json"), "utf8");
for (const prohibited of ["service_role", "SUPABASE_SERVICE_ROLE_KEY", ".ulf", "private_key"]) {
  if (environment.toLowerCase().includes(prohibited.toLowerCase())) fail(`prohibited credential marker in environment: ${prohibited}`);
}

if (!fs.existsSync(path.join(root, "mobile/app.json"))) fail("mobile fallback was removed");
if (!fs.existsSync(path.join(root, "mobile/lib/supabase.ts"))) fail("mobile Supabase client was removed");

const prohibitedArtifacts = [];
const scan = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "Library", "Temp", "Logs"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(fullPath);
    else if (/\.(apk|aab|unitypackage)$/i.test(entry.name)) prohibitedArtifacts.push(path.relative(root, fullPath));
  }
};
scan(root);
if (prohibitedArtifacts.length) fail(`build artifact present: ${prohibitedArtifacts.join(", ")}`);

if (!process.exitCode) console.log("UNITY VERIFY PASSED: scaffold, authority boundaries, Expo fallback and no-build gate are present.");