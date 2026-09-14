#!/usr/bin/env node
/**
 * T2V guard: shared visual roles must exist and at least one shared state
 * surface must consume the primitive. This is intentionally offline; it does
 * not inspect or mutate Supabase data.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const failures = [];

function source(relativePath) {
  const fullPath = resolve(root, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`${relativePath} is missing`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

const tokens = source('mobile/constants/experience.ts');
for (const token of [
  'VISUAL_TOKENS',
  'material:',
  'colorRoles:',
  'typography:',
  'radius:',
  'border:',
  'shadow:',
  'icon:',
  'spacing:',
  'safeArea:',
  'qualityTiers:',
]) {
  if (!tokens.includes(token)) failures.push(`shared visual token "${token}" is missing`);
}

const panel = source('mobile/components/MaterialPanel.tsx');
for (const token of ['VISUAL_TOKENS', 'useReducedMotion', 'shadowOpacity', 'elevation']) {
  if (!panel.includes(token)) failures.push(`MaterialPanel is missing "${token}"`);
}

const state = source('mobile/components/DomainState.tsx');
if (!state.includes("from '@/components/MaterialPanel'")) {
  failures.push('DomainState does not consume MaterialPanel');
}
if (!state.includes('materialRole={kind ===')) {
  failures.push('DomainState does not select a semantic material role');
}
if (!state.includes('tone={kind ===')) {
  failures.push('DomainState does not select a semantic tone');
}

if (failures.length > 0) {
  console.error('T2V visual system guard failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('T2V visual system guard passed (shared tokens + MaterialPanel + DomainState)');