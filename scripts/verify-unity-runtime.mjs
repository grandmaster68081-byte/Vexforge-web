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
  "Assets/Scripts/Presentation/VexforgeCardArtResolver.cs",
  "Assets/Scripts/Presentation/VexforgeTextureLruCache.cs",
  "Assets/Scripts/Presentation/VexforgeCardView.cs",
  "Assets/Scripts/Presentation/VexforgeCardPool.cs",
  "Assets/Scripts/Presentation/VexforgeWorldHotspot.cs",
  "Assets/Scripts/Presentation/VexforgeDiegeticInputRouter.cs",
  "Assets/Scripts/Presentation/VexforgeNexusStage.cs",
  "Assets/Scripts/Presentation/NexusPresentationRoot.cs",
  "Assets/Scripts/Presentation/NexusDevelopmentFallback.cs",
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

const presentationRoot = path.join(unity, "Assets/Scripts/Presentation");
const presentationSources = fs
  .readdirSync(presentationRoot)
  .filter((entry) => entry.endsWith(".cs"))
  .map((entry) => fs.readFileSync(path.join(presentationRoot, entry), "utf8"))
  .join("\n");
for (const prohibited of ["ScreenSpaceOverlay", "Shader.Find(", "ARTE DISPONIBLE", "Mathf.Min(catalog.Length, 8)"]) {
  if (presentationSources.includes(prohibited)) fail(`prohibited Presentation Foundation marker: ${prohibited}`);
}

const nexusSource = fs.readFileSync(path.join(presentationRoot, "NexusPresentationRoot.cs"), "utf8");
const gameShellSource = fs.readFileSync(path.join(unity, "Assets/Scripts/UI/GameShellController.cs"), "utf8");
for (const route of ["GameRoute.Collection", "GameRoute.Deck", "GameRoute.Battle", "GameRoute.Missions", "GameRoute.Economy"]) {
  if (!nexusSource.includes(route)) fail(`canonical Nexus gateway route is missing: ${route}`);
}
for (const route of ["GameRoute.Nexus", "GameRoute.Collection", "GameRoute.Deck", "GameRoute.Battle", "GameRoute.Missions", "GameRoute.Economy", "GameRoute.Profile"]) {
  if (!gameShellSource.includes(route)) fail(`canonical GameShell route is missing: ${route}`);
}
for (const alias of ["GameRoute.Archive", "GameRoute.Forge", "GameRoute.Battlefield"]) {
  if (nexusSource.includes(alias) || gameShellSource.includes(alias)) fail(`forbidden route alias remains: ${alias}`);
}

if (!process.exitCode) console.log("UNITY VERIFY PASSED: canonical routes, scaffold, authority boundaries, legacy mobile tree and no-build gate are present.");