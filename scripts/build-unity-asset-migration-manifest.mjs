import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const sourceRoot = "mobile/assets";
const unityRoot = "unity/Assets";
const registryPath = "unity/Assets/Resources/VexforgeTier1/VexforgeTier1AssetManifest.json";
const outputPath = "docs/vexforge-canonical/30_EXPO_UNITY_ASSET_MIGRATION_MANIFEST.json";
const tracked = (pathspec) =>
  execFileSync("git", ["ls-files", "-z", "--", pathspec], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .sort();

const mobileFiles = tracked(sourceRoot);
const unityFiles = tracked(unityRoot).filter((file) => !file.endsWith(".meta"));
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const registeredUnityFiles = new Set();

for (const entry of registry.assets ?? []) {
  if (!entry.resources_key) {
    throw new Error(`Unity asset registry entry ${entry.asset_id ?? "(unknown)"} has no resources_key.`);
  }
  const basePath = `unity/Assets/Resources/${entry.resources_key}`;
  const matches = unityFiles.filter((file) => file === basePath || file.startsWith(`${basePath}.`));
  if (matches.length !== 1) {
    throw new Error(`Expected one Unity asset for ${entry.asset_id}; found ${matches.length}.`);
  }
  registeredUnityFiles.add(matches[0]);
}

const hashFile = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

function rasterDimensions(buffer, extension) {
  if (extension === ".png" && buffer.length >= 24 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (extension !== ".jpg" && extension !== ".jpeg") return null;
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
    if (startOfFrame.has(marker) && segmentLength >= 7) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
      };
    }
    offset += segmentLength;
  }
  return null;
}

function wavDetails(buffer) {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    return null;
  }

  let formatCode = null;
  let sampleRate = null;
  let channels = null;
  let bitsPerSample = null;
  let dataBytes = null;
  let byteRate = null;
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    if (chunkStart + chunkSize > buffer.length) break;
    if (chunkId === "fmt " && chunkSize >= 16) {
      formatCode = buffer.readUInt16LE(chunkStart);
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      byteRate = buffer.readUInt32LE(chunkStart + 8);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    } else if (chunkId === "data") {
      dataBytes = chunkSize;
    }
    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  return {
    formatCode,
    channels,
    sampleRate,
    bitsPerSample,
    dataBytes,
    durationSeconds: byteRate && dataBytes !== null ? Number((dataBytes / byteRate).toFixed(3)) : null,
    decodedPcmEstimateBytes: formatCode === 1 ? dataBytes : null,
  };
}

function semanticRole(file) {
  const relative = file.slice(`${sourceRoot}/`.length);
  const extension = path.extname(file).toLowerCase();
  if (extension === ".meta") return "Unity importer sidecar metadata present in the legacy mobile asset tree.";
  if (relative.startsWith("canonical/")) return "Canonical VEXFORGE presentation image; checked against the Unity resource registry.";
  if (relative.startsWith("content-packs/")) return "Expo content-prefetch tier image; no Unity resource-registry consumer is established.";
  if (relative.startsWith("registered/")) {
    const category = relative.split("/")[1] ?? "unclassified";
    return `Legacy registered artwork (${category}); no Unity resource-registry consumer is established.`;
  }
  if (relative.startsWith("vexforge/cinematics/")) return "Legacy cinematic still; no Unity resource-registry consumer is established.";
  if (relative.startsWith("vexforge/scenes/")) return "Legacy Expo scene image; no Unity resource-registry consumer is established.";
  if (relative.startsWith("vexforge/world/")) return "Legacy Expo world image; no Unity resource-registry consumer is established.";
  if (relative.startsWith("vexforge/") && extension === ".wav") return "VEXFORGE presentation audio cue; checked against the Unity resource registry.";
  if (relative.startsWith("vexforge/")) return "VEXFORGE presentation artwork; checked against the Unity resource registry.";
  if (relative.startsWith("images/")) return "Legacy mobile application icon or shell image.";
  return "Legacy mobile asset; role requires product-owner review before any Unity import.";
}

function exclusionReason(file) {
  const role = semanticRole(file);
  if (role.startsWith("Unity importer sidecar")) return "Importer metadata is not runtime content and must not be copied into the Unity project as a mobile asset.";
  if (role.startsWith("Expo content-prefetch")) return "No current Unity consumer or registered Unity destination was found; avoid bulk-copying Expo prefetch assets.";
  if (role.startsWith("Legacy registered artwork")) return "The legacy registered image has no current Unity resource-registry consumer; retain it only in the legacy source pending parity gates.";
  if (role.startsWith("Legacy cinematic")) return "No current Unity resource-registry consumer or approved final-art destination was found.";
  if (role.startsWith("Legacy Expo")) return "Unity has its own registered presentation assets; this Expo-specific image has no current Unity consumer.";
  if (role.startsWith("Legacy mobile application")) return "Application-shell artwork is not a Unity gameplay asset.";
  return "No current Unity resource-registry consumer was found; do not import without a verified use and destination.";
}

const mobileHashes = new Map();
for (const file of mobileFiles) {
  const digest = hashFile(file);
  const group = mobileHashes.get(digest) ?? [];
  group.push(file);
  mobileHashes.set(digest, group);
}

const unityHashes = new Map();
for (const file of unityFiles) {
  const digest = hashFile(file);
  const group = unityHashes.get(digest) ?? [];
  group.push(file);
  unityHashes.set(digest, group);
}

let sourceBytes = 0;
let rgba8EstimateBytes = 0;
const assets = mobileFiles.map((file) => {
  const contents = readFileSync(file);
  const sourceBytesForFile = statSync(file).size;
  const sha256 = createHash("sha256").update(contents).digest("hex");
  const extension = path.extname(file).toLowerCase();
  const dimensions = rasterDimensions(contents, extension);
  const wave = extension === ".wav" ? wavDetails(contents) : null;
  const allUnityMatches = unityHashes.get(sha256) ?? [];
  const registeredMatches = allUnityMatches.filter((candidate) => registeredUnityFiles.has(candidate));
  const role = semanticRole(file);
  sourceBytes += sourceBytesForFile;
  if (dimensions) rgba8EstimateBytes += dimensions.width * dimensions.height * 4;

  return {
    sourcePath: file,
    sha256,
    sourceBytes: sourceBytesForFile,
    mediaType: extension === ".meta" ? "unity-importer-metadata" : extension.slice(1) || "unknown",
    dimensions,
    semanticRole: role,
    duplicateCandidates: {
      exactWithinMobileAssets: (mobileHashes.get(sha256) ?? []).filter((candidate) => candidate !== file),
      exactInUnityAssets: allUnityMatches,
      exactInRegisteredUnityResources: registeredMatches,
    },
    unityDestination: registeredMatches,
    decision: registeredMatches.length > 0 ? "KEEP" : "DISCARD",
    decisionReason:
      registeredMatches.length > 0
        ? "Byte-identical to an asset already listed in the Unity Tier1 resource registry; reuse that destination and do not copy another payload."
        : exclusionReason(file),
    sourceRetention: "Keep the mobile source unchanged until every parity and removal gate passes.",
    costEstimate: {
      compressedSourceBytes: sourceBytesForFile,
      rgba8DecodedEstimateBytes: dimensions ? dimensions.width * dimensions.height * 4 : null,
      wav: wave,
      actualUnityImportedBuildBytes: null,
    },
  };
});

const internalDuplicateGroups = [...mobileHashes.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([sha256, files]) => ({ sha256, files }));
const unityReuse = assets.filter((asset) => asset.unityDestination.length > 0);
const decisions = assets.reduce((summary, asset) => {
  summary[asset.decision] = (summary[asset.decision] ?? 0) + 1;
  return summary;
}, { KEEP: 0, PORT: 0, DISCARD: 0 });

const inventory = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baselineCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  sourceScope: sourceRoot,
  unityResourceRegistry: registryPath,
  migrationRule: "KEEP only byte-identical assets already registered as Unity resources; otherwise DISCARD from Unity scope until a verified consumer/destination exists. PORT requires explicit evidence and is not inferred from filenames.",
  summary: {
    mobileFileCount: assets.length,
    mobileSourceBytes: sourceBytes,
    uniqueMobileHashes: mobileHashes.size,
    internalExactDuplicateGroups: internalDuplicateGroups,
    filesExactlyReusableFromRegisteredUnityResources: unityReuse.length,
    exactUnityReuseSourceBytes: unityReuse.reduce((sum, asset) => sum + asset.sourceBytes, 0),
    decisions,
    newFilesPortedToUnity: 0,
    unityPayloadBytesAdded: 0,
    theoreticalRgba8DecodedBytesIfEveryRasterWereLoaded: rgba8EstimateBytes,
    actualUnityImportedBuildBytes: null,
    registeredUnityResourcesChecked: registry.assets?.length ?? 0,
    physicalFilesDeletedFromMobile: 0,
  },
  estimates: {
    rgba8DecodedEstimateFormula: "width * height * 4; a raw pixel-memory upper-level estimate, not Unity runtime memory or GPU allocation evidence.",
    actualUnityBuildSize: "Not measured. No Unity import/build was run; platform compression, texture settings, and build stripping are unverified.",
    sourcePayload: "Exact tracked file byte size at the audited commit.",
  },
  sourcePreservation: "This manifest makes Unity import decisions only. No source files under mobile/assets are changed or deleted.",
  assets,
};

writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(
  `Wrote ${outputPath}: ${assets.length} assets, ${sourceBytes} source bytes, ${unityReuse.length} exact Unity reuses, ${decisions.DISCARD ?? 0} excluded from Unity.`,
);
