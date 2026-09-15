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
  'control:',
  'navigation:',
  'formation:',
  'assetError:',
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

const button = source('mobile/components/ForgeButton.tsx');
if (!button.includes("from '@/constants/experience'")) {
  failures.push('ForgeButton does not consume shared visual tokens');
}
if (!button.includes('VISUAL_TOKENS.control.button')) {
  failures.push('ForgeButton does not consume control tokens');
}

const progress = source('mobile/components/ProgressBar.tsx');
if (!progress.includes("from '@/constants/experience'")) {
  failures.push('ProgressBar does not consume shared visual tokens');
}
if (!progress.includes('VISUAL_TOKENS.control.progress')) {
  failures.push('ProgressBar does not consume progress control tokens');
}

const domainHeader = source('mobile/components/DomainHeader.tsx');
if (!domainHeader.includes("from '@/constants/experience'")) {
  failures.push('DomainHeader does not consume shared visual tokens');
}
if (!domainHeader.includes('VISUAL_TOKENS.domainHeader')) {
  failures.push('DomainHeader does not consume header tokens');
}
for (const token of ['domainHeader.place', 'domainHeader.title', 'domainHeader.purpose']) {
  if (!domainHeader.includes(`VISUAL_TOKENS.${token}`)) {
    failures.push(`DomainHeader is missing typography token "${token}"`);
  }
}

const forgeText = source('mobile/components/ForgeText.tsx');
if (!forgeText.includes("from '@/constants/experience'")) {
  failures.push('ForgeText does not consume shared visual tokens');
}
if (!forgeText.includes('VISUAL_TOKENS.typography')) {
  failures.push('ForgeText does not consume typography tokens');
}

const screenShell = source('mobile/components/ScreenShell.tsx');
if (!screenShell.includes("from '@/constants/experience'")) {
  failures.push('ScreenShell does not consume shared visual tokens');
}
if (!screenShell.includes('VISUAL_TOKENS.scene')) {
  failures.push('ScreenShell does not consume scene tokens');
}
if (!screenShell.includes('VISUAL_TOKENS.state.assetError')) {
  failures.push('ScreenShell does not consume asset error state tokens');
}

if (!state.includes('VISUAL_TOKENS.state')) {
  failures.push('DomainState does not consume state tokens');
}
for (const token of ['state.skeletonLineLongWidth', 'state.skeletonLineShortWidth', 'state.actionTextTracking']) {
  if (!state.includes(`VISUAL_TOKENS.${token}`)) {
    failures.push(`DomainState is missing visual token "${token}"`);
  }
}

const errorFallback = source('mobile/components/ErrorFallback.tsx');
if (!errorFallback.includes("from '@/constants/experience'")) {
  failures.push('ErrorFallback does not consume shared visual tokens');
}
if (!errorFallback.includes('VISUAL_TOKENS.state.errorFallback')) {
  failures.push('ErrorFallback does not consume recovery surface tokens');
}
for (const token of [
  'state.errorFallback.contentMaxWidth',
  'state.errorFallback.button.shadow',
  'state.errorFallback.modalOverlayOpacity',
]) {
  if (!errorFallback.includes(`VISUAL_TOKENS.${token}`)) {
    failures.push(`ErrorFallback is missing visual token "${token}"`);
  }
}

const icon = source('mobile/components/ForgeIcon.tsx');
if (!icon.includes("from '@/constants/experience'")) {
  failures.push('ForgeIcon does not consume shared visual tokens');
}
if (!icon.includes('VISUAL_TOKENS.icon.defaultStroke')) {
  failures.push('ForgeIcon does not consume the default stroke token');
}

const formation = source('mobile/components/ForgeFormationPreview.tsx');
if (!formation.includes("from '@/constants/experience'")) {
  failures.push('ForgeFormationPreview does not consume shared visual tokens');
}
if (!formation.includes('VISUAL_TOKENS.formation')) {
  failures.push('ForgeFormationPreview does not consume formation tokens');
}

const navigation = source('mobile/app/(tabs)/_layout.tsx');
if (!navigation.includes("from '@/constants/experience'")) {
  failures.push('TabLayout does not consume shared visual tokens');
}
if (!navigation.includes('VISUAL_TOKENS.navigation')) {
  failures.push('TabLayout does not consume navigation tokens');
}

const identityMark = source('mobile/components/ForgeMark.tsx');
if (!identityMark.includes("from '@/constants/experience'")) {
  failures.push('ForgeMark does not consume shared visual tokens');
}
if (!identityMark.includes('VISUAL_TOKENS.identityMark')) {
  failures.push('ForgeMark does not consume identity mark tokens');
}

const profile = source('mobile/app/(tabs)/profile.tsx');
if (!profile.includes("from '@/constants/experience'")) {
  failures.push('Profile does not consume shared visual tokens');
}
if (!profile.includes('VISUAL_TOKENS.metricPlaque')) {
  failures.push('Profile does not consume metric plaque tokens');
}

const battlefield = source('mobile/components/ForgeBattlefield.tsx');
if (!battlefield.includes("from '@/constants/experience'")) {
  failures.push('ForgeBattlefield does not consume shared visual tokens');
}
if (!battlefield.includes('VISUAL_TOKENS.battlefield')) {
  failures.push('ForgeBattlefield does not consume battlefield tokens');
}
if (!battlefield.includes('VISUAL_TOKENS.battlefield.typography')) {
  failures.push('ForgeBattlefield does not consume battlefield typography tokens');
}
if (!battlefield.includes('VISUAL_TOKENS.battlefield.controls')) {
  failures.push('ForgeBattlefield does not consume battlefield control tokens');
}

const home = source('mobile/app/(tabs)/index.tsx');
if (!home.includes("from '@/constants/experience'")) {
  failures.push('Home does not consume shared visual tokens');
}
if (!home.includes('VISUAL_TOKENS.domainPortal')) {
  failures.push('Home does not consume domain portal tokens');
}

if (failures.length > 0) {
  console.error('T2V visual system guard failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('T2V visual system guard passed (shared tokens + domain portal + battlefield + metric plaque + identity mark + navigation shell + MaterialPanel + DomainState)');