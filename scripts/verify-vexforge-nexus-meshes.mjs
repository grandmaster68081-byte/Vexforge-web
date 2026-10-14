import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modelsRoot = path.join(
  root,
  'unity/Assets/Resources/VexforgeTier1/Models',
);
const manifestPath = path.join(modelsRoot, 'VexforgeWorldMeshManifest.json');
const failures = [];
const expectedAssets = [
  'VF_NEXUS_CITADEL_DAIS',
  'VF_NEXUS_CITADEL_SPINE',
  'VF_NEXUS_PORTAL_GATE',
];
const allowedMaterials = new Set([
  'VEXFORGE_OBSIDIAN',
  'VEXFORGE_IRON',
  'VEXFORGE_BRASS',
  'VEXFORGE_CYAN',
  'VEXFORGE_ACCENT',
]);

function readText(filePath, label) {
  if (!fs.existsSync(filePath)) {
    failures.push(`${label} is missing`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function extractMethod(source, signature, label) {
  const start = source.indexOf(signature);
  if (start < 0) {
    failures.push(`${label}: method signature not found`);
    return '';
  }
  const open = source.indexOf('{', start);
  if (open < 0) {
    failures.push(`${label}: method body not found`);
    return '';
  }

  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') depth--;
    if (depth === 0) return source.slice(open + 1, index);
  }
  failures.push(`${label}: method body is not closed`);
  return '';
}

function parsePngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 ||
      bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a' ||
      bytes.toString('ascii', 12, 16) !== 'IHDR') return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function vectorFromObjVertex(line) {
  const values = line.trim().split(/\s+/).slice(1).map(Number);
  return values.length >= 3 ? values.slice(0, 3) : null;
}

function validateObj(entry) {
  const objPath = path.join(modelsRoot, entry.source_file);
  const text = readText(objPath, `${entry.asset_id} OBJ`);
  if (!text) return { triangleCount: 0, usedMaterials: new Set() };

  const vertices = [];
  const usedMaterials = new Set();
  let triangleCount = 0;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('v ')) {
      const vertex = vectorFromObjVertex(line);
      if (!vertex || vertex.some((component) => !Number.isFinite(component))) {
        failures.push(`${entry.asset_id}: contains a non-finite or malformed vertex`);
      } else {
        vertices.push(vertex);
      }
    } else if (line.startsWith('usemtl ')) {
      const material = line.slice('usemtl '.length).trim();
      usedMaterials.add(material);
      if (!allowedMaterials.has(material)) {
        failures.push(`${entry.asset_id}: uses an unapproved material slot ${material}`);
      }
    } else if (line.startsWith('f ')) {
      const indices = line.slice(2).trim().split(/\s+/);
      if (indices.length !== 3) {
        failures.push(`${entry.asset_id}: source faces must be triangulated`);
        continue;
      }
      const points = indices.map((token) => {
        const vertexIndex = Number(token.split('/')[0]);
        if (!Number.isInteger(vertexIndex) || vertexIndex < 1 || vertexIndex > vertices.length) {
          failures.push(`${entry.asset_id}: face references an invalid vertex`);
          return null;
        }
        return vertices[vertexIndex - 1];
      });
      if (points.some((point) => point == null)) continue;
      const ab = points[1].map((value, index) => value - points[0][index]);
      const ac = points[2].map((value, index) => value - points[0][index]);
      const normal = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
      if (Math.hypot(...normal) < 0.00001) {
        failures.push(`${entry.asset_id}: contains a zero-area triangle`);
      }
      triangleCount++;
    }
  }

  if (triangleCount < 100) {
    failures.push(`${entry.asset_id}: expected authored 3D geometry, found ${triangleCount} triangles`);
  }
  for (const slot of entry.material_slots || []) {
    if (!usedMaterials.has(slot)) {
      failures.push(`${entry.asset_id}: declared material slot is unused: ${slot}`);
    }
  }
  return { triangleCount, usedMaterials };
}

if (!fs.existsSync(manifestPath)) {
  console.error('NEXUS MESH SOURCE VERIFY FAILED — mesh manifest is missing.');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  failures.push(`mesh manifest is not valid JSON: ${error.message}`);
  manifest = null;
}

if (manifest) {
  if (manifest.schema_version !== '1.0') failures.push('unsupported mesh manifest schema');
  if (manifest.product !== 'VEXFORGE') failures.push('mesh manifest product is not VEXFORGE');
  if (!Array.isArray(manifest.assets)) failures.push('mesh manifest has no asset entries');
  const actualIds = (manifest.assets || []).map((entry) => entry?.asset_id);
  for (const id of expectedAssets) {
    if (!actualIds.includes(id)) failures.push(`required world mesh is not registered: ${id}`);
  }
  if (new Set(actualIds).size !== actualIds.length) failures.push('mesh manifest contains duplicate asset IDs');
  if (manifest.source_of_truth !== 'scripts/generate-vexforge-nexus-meshes.mjs') {
    failures.push('mesh manifest does not point to its deterministic source generator');
  }

  const materialText = readText(
    path.join(modelsRoot, 'VEXFORGE_NEXUS_KIT.mtl'),
    'VEXFORGE material library',
  );
  const declaredMaterials = new Set(
    [...materialText.matchAll(/^newmtl\s+(\S+)\s*$/gm)].map((match) => match[1]),
  );
  for (const material of manifest.materials || []) {
    if (!declaredMaterials.has(material)) failures.push(`MTL has no definition for ${material}`);
  }

  for (const match of materialText.matchAll(/^map_Kd\s+(.+)$/gm)) {
    const textureName = match[1].trim();
    const texturePath = path.join(modelsRoot, textureName);
    if (!fs.existsSync(texturePath)) {
      failures.push(`material texture is missing: ${textureName}`);
      continue;
    }
    const dimensions = parsePngDimensions(texturePath);
    if (!dimensions || dimensions[0] < 256 || dimensions[1] < 256) {
      failures.push(`material texture dimensions are unreadable or too small: ${textureName}`);
    }
  }

  let totalTriangles = 0;
  for (const entry of manifest.assets || []) {
    if (!entry || typeof entry.asset_id !== 'string' ||
        !Array.isArray(entry.material_slots) || entry.material_slots.length === 0) {
      failures.push('mesh manifest contains an incomplete asset entry');
      continue;
    }
    const result = validateObj(entry);
    totalTriangles += result.triangleCount;
  }
  if (totalTriangles < 500) failures.push(`expected substantial authored mesh geometry, found ${totalTriangles} triangles`);
}

const alphaSource = readText(
  path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeAlphaWorldDirector.cs'),
  'active world director',
);
const nexusSource = readText(
  path.join(root, 'unity/Assets/Scripts/Presentation/NexusPresentationRoot.cs'),
  'Nexus foundation',
);
const factorySource = readText(
  path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeWorldMeshFactory.cs'),
  'world-mesh factory',
);
const runtimeGates = [
  [extractMethod(alphaSource, 'private void BuildNexus()', 'Alpha Nexus'), 'Alpha Nexus'],
  [extractMethod(alphaSource, 'private void BuildPortal(PortalSpec spec)', 'Alpha portal'), 'Alpha portal'],
  [extractMethod(nexusSource, 'private void BuildWorld()', 'Nexus foundation'), 'Nexus foundation'],
  [extractMethod(nexusSource, 'private void CreatePortal(PortalDefinition definition)', 'Nexus portal'), 'Nexus portal'],
];
for (const [method, label] of runtimeGates) {
  if (/\b(?:GameObject\.CreatePrimitive|CreatePrimitive\s*\(|CreateRing\s*\(|TextMesh|PrimitiveType\.)/.test(method)) {
    failures.push(`${label}: production Nexus path still uses primitive/text placeholder geometry`);
  }
}
if (!alphaSource.includes('hotspot.RouteRequested += HandleRouteRequested') ||
    !alphaSource.includes('navigation.Navigate(nextRoute)')) {
  failures.push('active Nexus route events are not connected to NavigationService');
}
if (!factorySource.includes('Resources.Load<GameObject>') ||
    !factorySource.includes('ValidateImportedModel') ||
    !factorySource.includes('critical world mesh failed to import')) {
  failures.push('runtime factory does not strictly load and validate authored Unity models');
}
if (!factorySource.includes('materialResolver(imported.name)')) {
  failures.push('runtime factory does not map imported material slots');
}

if (failures.length) {
  console.error('NEXUS MESH SOURCE VERIFY FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const triangles = (manifest.assets || []).reduce(
  (count, entry) => count + validateObj(entry).triangleCount,
  0,
);
console.log(
  `NEXUS MESH SOURCE PASS — ${manifest.assets.length} original OBJ models, ` +
  `${triangles} authored triangles, deterministic textures/material slots, and no primitive/text placeholder in either Nexus route. ` +
  'Unity model import, material assignment, and Game View remain separate Editor gates.',
);
