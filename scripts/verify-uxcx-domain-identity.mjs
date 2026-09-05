#!/usr/bin/env node
/**
 * VE-UXCX-1-DOMAIN-IDENTITY-SHELL guard (offline).
 *
 * Directive: docs/VE-UXCX-TIER1-2026/00_LOVABLE_MASTER_DIRECTIVE.md
 *
 * The five domains must share one identity language. This guard fails when a
 * domain screen re-invents its own header instead of consuming DomainHeader,
 * or when the shared identity registry loses a domain.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const failures = [];

const identityPath = resolve(root, 'mobile/constants/experience.ts');
if (!existsSync(identityPath)) {
  failures.push('mobile/constants/experience.ts is missing');
} else {
  const identity = readFileSync(identityPath, 'utf8');
  for (const key of ['foja', 'arena', 'archivo', 'forja', 'legado']) {
    if (!new RegExp(`\\b${key}:\\s*{`).test(identity)) {
      failures.push(`DOMAIN_IDENTITY is missing the "${key}" domain`);
    }
  }
  for (const token of ['micro', 'reveal', 'navigation', 'ambient']) {
    if (!new RegExp(`\\b${token}:`).test(identity)) {
      failures.push(`MOTION token "${token}" is missing`);
    }
  }
}

const headerPath = resolve(root, 'mobile/components/DomainHeader.tsx');
if (!existsSync(headerPath)) {
  failures.push('mobile/components/DomainHeader.tsx is missing');
} else {
  const header = readFileSync(headerPath, 'utf8');
  if (!header.includes('useReducedMotion')) {
    failures.push('DomainHeader must honour reduced motion');
  }
  if (!header.includes('DOMAIN_IDENTITY')) {
    failures.push('DomainHeader must read the shared identity registry');
  }
}

const screens = [
  ['mobile/app/(tabs)/battle.tsx', 'arena'],
  ['mobile/app/(tabs)/collection.tsx', 'archivo'],
  ['mobile/app/(tabs)/deck.tsx', 'forja'],
  ['mobile/app/(tabs)/profile.tsx', 'legado'],
];

for (const [file, domain] of screens) {
  const full = resolve(root, file);
  if (!existsSync(full)) {
    failures.push(`${file} is missing`);
    continue;
  }
  const source = readFileSync(full, 'utf8');
  if (!source.includes("from '@/components/DomainHeader'")) {
    failures.push(`${file} does not import DomainHeader`);
  }
  if (!source.includes(`domain="${domain}"`)) {
    failures.push(`${file} does not declare domain="${domain}"`);
  }
}

// ITERACIÓN 2 — FOJA LIVING HUB: la base debe leerse como lugar vivo y no
// como panel: identidad compartida, tokens de motion/profundidad, parallax de
// scroll, ambiente idle y hotspots hacia dominios reales.
const fojaPath = resolve(root, 'mobile/app/(tabs)/index.tsx');
if (!existsSync(fojaPath)) {
  failures.push('mobile/app/(tabs)/index.tsx is missing');
} else {
  const foja = readFileSync(fojaPath, 'utf8');
  const fojaChecks = [
    ["from '@/constants/experience'", 'FOJA must consume the shared experience tokens'],
    ['DOMAIN_IDENTITY.foja', 'FOJA must present itself through the shared identity registry'],
    ['MOTION.', 'FOJA must use MOTION tokens instead of ad-hoc durations'],
    ['DEPTH.', 'FOJA must layer its scene with DEPTH tokens'],
    ['useAnimatedScrollHandler', 'FOJA must drive parallax from scroll'],
    ['useReducedMotion', 'FOJA must honour reduced motion'],
    ['SceneOrbitPoint', 'FOJA must expose world hotspots'],
    ['signal={domainSignals.', 'FOJA hotspots must carry contextual activity from real data'],
  ];
  for (const [needle, message] of fojaChecks) {
    if (!foja.includes(needle)) failures.push(message);
  }
  if (/duration:\s*\d{3,}/.test(foja.replace(/MOTION\.[a-z]+\s*\*\s*\d+/g, ''))) {
    failures.push('FOJA still declares raw animation durations outside MOTION tokens');
  }
}

if (failures.length > 0) {
  console.error('VE-UXCX domain identity guard failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`VE-UXCX domain identity guard passed (${screens.length + 1} domain screens, 5 identities, FOJA living hub).`);
