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

if (failures.length > 0) {
  console.error('VE-UXCX domain identity guard failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`VE-UXCX domain identity guard passed (${screens.length} domain screens, 5 identities).`);
