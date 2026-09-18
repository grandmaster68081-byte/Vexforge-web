import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const csFiles = walk(path.join(root, 'unity')).filter((p) => p.endsWith('.cs'));
const typeNames = new Map();

for (const file of csFiles) {
  const source = fs.readFileSync(file, 'utf8');
  let balance = 0;

  for (const ch of source) {
    if (ch === '{') balance++;
    if (ch === '}') balance--;
    if (balance < 0) break;
  }

  if (balance !== 0) {
    failures.push(`${path.relative(root, file)}: unbalanced braces`);
  }

  if (/\bMaterialPropertyBlock\b/.test(source)) {
    failures.push(`${path.relative(root, file)}: MaterialPropertyBlock present`);
  }

  if (/\bUnityEngine\.Input\b/.test(source)) {
    failures.push(`${path.relative(root, file)}: legacy Input API present`);
  }

  if (/GameRoute\.(Archive|Forge|Battlefield)\b/.test(source)) {
    failures.push(`${path.relative(root, file)}: invalid route alias`);
  }

  for (const match of source.matchAll(/\b(?:class|sealed class|struct|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
    const name = match[1];
    const relative = path.relative(root, file);

    if (typeNames.has(name)) {
      failures.push(`duplicate type ${name}: ${typeNames.get(name)} / ${relative}`);
    } else {
      typeNames.set(name, relative);
    }
  }
}

const cardView = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeCardView.cs'),
  'utf8'
);

if (/card_tier[\s\S]{0,220}illustration|illustration[\s\S]{0,220}card_tier/.test(cardView)) {
  failures.push('CardArtMode may not be derived from card_tier');
}

const resolver = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeCardArtResolver.cs'),
  'utf8'
);

for (const token of [
  'rscuzqnfccqvltkdcdny.supabase.co',
  'maxDimension',
  'inFlight',
  'SemaphoreSlim',
  'Content-Type'
]) {
  if (!resolver.toLowerCase().includes(token.toLowerCase())) {
    failures.push(`resolver missing expected safeguard/token: ${token}`);
  }
}

const gallery = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/Presentation/VexforgeVirtualizedCardGallery.cs'),
  'utf8'
);

for (const token of [
  'MaxActiveInstances',
  'SetData',
  'ReturnVisible',
  'PointerDragged',
  'CardArtMode.FullCardArtwork'
]) {
  if (!gallery.includes(token)) failures.push(`gallery missing expected behavior: ${token}`);
}

const gameShell = fs.readFileSync(
  path.join(root, 'unity/Assets/Scripts/UI/GameShellController.cs'),
  'utf8'
);

if (/\bCardRenderer\b|\bNexusWorldController\b|ScreenSpaceOverlay/.test(gameShell)) {
  failures.push('GameShell contains legacy runtime integration');
}

if (/\bMathf\.Min\s*\(\s*catalog\.Length\s*,\s*8\s*\)/.test(gameShell)) {
  failures.push('GameShell contains artificial eight-card catalog limit');
}

if (failures.length > 0) {
  console.error('PACKAGE INTERNAL VALIDATION FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PACKAGE INTERNAL VALIDATION PASSED (${csFiles.length} C# files scanned).`);
