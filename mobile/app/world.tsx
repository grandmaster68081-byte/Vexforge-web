import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { DomainState } from '@/components/DomainState';
import { ProgressBar } from '@/components/ProgressBar';
import { VISUAL_TOKENS } from '@/constants/experience';
import {
  claimWorldSeasonTier,
  contributeWorldRaid,
  joinWorldRaid,
  loadWorldSnapshot,
  type MobileBossEncounter,
  type MobileLoreEntry,
  type MobileRaidRun,
    type MobileSeasonTier,
  type MobileWorldBoss,
  type MobileWorldSnapshot,
} from '@/lib/supabase';

type Panel = 'bosses' | 'raids' | 'lore' | 'season' | 'rankings';
type Colors = ReturnType<typeof useColors>;

const PANELS: Array<{ id: Panel; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'bosses', label: 'Bosses', icon: 'target' },
  { id: 'raids', label: 'Raids', icon: 'people' },
  { id: 'lore', label: 'Codex', icon: 'lore' },
  { id: 'season', label: 'Pase', icon: 'award' },
  { id: 'rankings', label: 'Ranking', icon: 'rankings' },
];

function tierTone(tier: string, colors: Colors) {
  const value = tier?.trim().toLowerCase() ?? '';
  if (value.includes('6') || value === 'legendary') return colors.danger;
  if (value.includes('5') || value === 'epic') return colors.rarityEpic;
  if (value.includes('4') || value === 'rare') return colors.primary;
  return colors.accent;
}

function worldBossIdentity(boss: MobileWorldBoss) {
  return {
    code: boss.boss_code?.trim() || 'CÓDIGO NO REPORTADO',
    name: boss.name?.trim() || 'NOMBRE DEL JEFE NO REPORTADO',
    tier: boss.tier?.trim() ? boss.tier.trim().toUpperCase() : 'TIER NO REPORTADO',
  };
}

function worldRaidIdentity(raid: MobileRaidRun) {
  const metadataName = typeof raid.metadata?.name === 'string' ? raid.metadata.name.trim() : '';
  return {
    code: raid.raid_code?.trim() || 'CÓDIGO DE RAID NO REPORTADO',
    name: metadataName || 'NOMBRE DE RAID NO REPORTADO',
  };
}

function worldBossLore(boss: MobileWorldBoss) {
  const lore = typeof boss.metadata?.lore === 'string' ? boss.metadata.lore.trim() : '';
  return lore || 'LORE NO REPORTADO';
}

function difficultyTone(difficulty: string | undefined, colors: Colors) {
  if (difficulty === 'hard') return colors.rarityEpic;
  if (difficulty === 'easy') return colors.success;
  return colors.primary;
}

function labelize(value: string | null | undefined, missingLabel = 'DATO NO REPORTADO') {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : missingLabel;
}

function worldStatusLabel(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'pending') return 'PENDIENTE';
  if (normalized === 'active') return 'ACTIVO';
  if (normalized === 'completed') return 'COMPLETADO';
  if (normalized === 'failed') return 'FALLIDO';
  if (normalized === 'cancelled') return 'CANCELADO';
  return normalized ? `ESTADO: ${normalized.toUpperCase()}` : 'ESTADO NO REPORTADO';
}

function loreTitle(entry: MobileLoreEntry) {
  const title = entry.title?.trim();
  if (title) return title;
  const code = entry.entry_code?.trim();
  return code ? `ENTRADA ${code}` : 'TÍTULO NO REPORTADO';
}

function loreContent(value: string | null | undefined) {
  return value?.trim() || 'CONTENIDO NO REPORTADO';
}

function formatNumber(value: number) {
  return value.toLocaleString('es-ES');
}

function numberSignal(value: number | null | undefined, label: string) {
  return typeof value === 'number' && Number.isFinite(value) ? formatNumber(value) : `${label} NO REPORTADO`;
}

function rankingMetric(value: number | null | undefined, label: string) {
  return typeof value === 'number' && Number.isFinite(value) ? formatNumber(value) : `${label} NO REPORTADO`;
}

function rankingSeasonLabel(value: string | null | undefined) {
  return value?.trim() || 'NO CONFIRMADA';
}

function rankingName(value: string | null | undefined) {
  return value?.trim() || 'NOMBRE NO RESUELTO';
}

function rankingWinRate(wins: number | null | undefined, losses: number | null | undefined, draws: number | null | undefined) {
  if (typeof wins !== 'number' || !Number.isFinite(wins) || typeof losses !== 'number' || !Number.isFinite(losses) || typeof draws !== 'number' || !Number.isFinite(draws)) return 'PORCENTAJE NO REPORTADO';
  const totalMatches = wins + losses + draws;
  return totalMatches > 0 ? `${Math.round((wins / totalMatches) * 100)}%` : 'SIN PARTIDAS';
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'FECHA NO REPORTADA';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'FECHA NO VÁLIDA' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

function rewardNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function rewardText(reward: Record<string, unknown> | undefined) {
  if (!reward) return 'RECOMPENSA NO REPORTADA';
  const parts: string[] = [];
  const appendNumericReward = (key: string, label: string) => {
    if (!(key in reward)) return;
    const value = rewardNumber(reward[key]);
    parts.push(value === null ? `${label} NO REPORTADO` : `${formatNumber(value)} ${label}`);
  };
  appendNumericReward('vex_ingame', 'VEX');
  appendNumericReward('shards', 'FRAGMENTOS');
  if ('card_rarity' in reward) {
    const rarity = typeof reward.card_rarity === 'string' ? reward.card_rarity.trim() : '';
    parts.push(rarity ? `CARTA ${rarity}` : 'CARTA NO REPORTADA');
  }
  return parts.join(' · ') || 'RECOMPENSA SIN DETALLE';
}

function WorldHeader({ panel, onPanelChange, onRefresh, refreshing, colors }: { panel: Panel; onPanelChange: (panel: Panel) => void; onRefresh: () => void; refreshing: boolean; colors: Colors }) {
  return (
    <View style={worldHeaderStyles.header}>
      <View style={worldHeaderStyles.headerTop}>
        <View style={[worldHeaderStyles.headerSeal, { backgroundColor: `${colors.accent}14`, borderColor: `${colors.accent}88` }]}>
          <Feather name="globe" size={VISUAL_TOKENS.worldHeader.seal.iconSize} color={colors.accent} />
        </View>
        <View style={worldHeaderStyles.headerCopy}>
          <Text style={[worldHeaderStyles.eyebrow, { color: colors.accent }]}>VEXFORGE / WORLD</Text>
          <Text style={[worldHeaderStyles.title, { color: colors.foreground }]}>Mundo navegable</Text>
        </View>
        <Pressable testID="world-refresh" accessibilityRole="button" accessibilityLabel="Actualizar mundo" onPress={onRefresh} style={({ pressed }) => [worldHeaderStyles.refreshButton, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
          {refreshing ? <ActivityIndicator size="small" color={colors.accent} /> : <Feather name="refresh" size={VISUAL_TOKENS.worldHeader.refresh.iconSize} color={colors.foreground} />}
        </Pressable>
      </View>
      <Text style={[worldHeaderStyles.copy, { color: colors.mutedForeground }]}>Explora los frentes vivos, las incursiones cooperativas, el Codex y el pulso competitivo de la temporada.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={worldHeaderStyles.tabs}>
        {PANELS.map((item) => {
          const active = item.id === panel;
          return (
            <Pressable key={item.id} testID={`world-tab-${item.id}`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onPanelChange(item.id)} style={[worldHeaderStyles.tab, { backgroundColor: active ? `${colors.accent}18` : colors.panel, borderColor: active ? colors.accent : colors.border }]}>
              <Feather name={item.icon} size={14} color={active ? colors.accent : colors.mutedForeground} />
              <Text style={[worldHeaderStyles.tabText, { color: active ? colors.accent : colors.mutedForeground }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const worldHeaderStyles = StyleSheet.create({
  header: {
    paddingHorizontal: VISUAL_TOKENS.worldHeader.root.paddingHorizontal,
    gap: VISUAL_TOKENS.worldHeader.root.gap,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.worldHeader.top.gap,
  },
  headerCopy: { flex: 1 },
  headerSeal: {
    width: VISUAL_TOKENS.worldHeader.seal.size,
    height: VISUAL_TOKENS.worldHeader.seal.size,
    borderRadius: VISUAL_TOKENS.worldHeader.seal.radius,
    borderWidth: VISUAL_TOKENS.worldHeader.seal.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: VISUAL_TOKENS.worldHeader.refresh.size,
    height: VISUAL_TOKENS.worldHeader.refresh.size,
    borderRadius: VISUAL_TOKENS.worldHeader.refresh.radius,
    borderWidth: VISUAL_TOKENS.worldHeader.refresh.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: VISUAL_TOKENS.worldHeader.eyebrow.fontSize,
    fontWeight: VISUAL_TOKENS.worldHeader.eyebrow.fontWeight,
    letterSpacing: VISUAL_TOKENS.worldHeader.eyebrow.letterSpacing,
  },
  title: {
    fontSize: VISUAL_TOKENS.worldHeader.title.fontSize,
    fontWeight: VISUAL_TOKENS.worldHeader.title.fontWeight,
    marginTop: VISUAL_TOKENS.worldHeader.title.marginTop,
  },
  copy: {
    fontSize: VISUAL_TOKENS.worldHeader.copy.fontSize,
    lineHeight: VISUAL_TOKENS.worldHeader.copy.lineHeight,
  },
  tabs: {
    gap: VISUAL_TOKENS.worldHeader.tabs.gap,
    paddingVertical: VISUAL_TOKENS.worldHeader.tabs.paddingVertical,
    paddingRight: VISUAL_TOKENS.worldHeader.tabs.paddingRight,
  },
  tab: {
    minHeight: VISUAL_TOKENS.worldHeader.tab.minHeight,
    borderWidth: VISUAL_TOKENS.worldHeader.tab.borderWidth,
    borderRadius: VISUAL_TOKENS.worldHeader.tab.radius,
    paddingHorizontal: VISUAL_TOKENS.worldHeader.tab.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.worldHeader.tab.gap,
  },
  tabText: {
    fontSize: VISUAL_TOKENS.worldHeader.tabText.fontSize,
    fontWeight: VISUAL_TOKENS.worldHeader.tabText.fontWeight,
    letterSpacing: VISUAL_TOKENS.worldHeader.tabText.letterSpacing,
  },
});

function BossCard({ boss, encounters, onBattle, colors }: { boss: MobileWorldBoss; encounters: MobileBossEncounter[]; onBattle: () => void; colors: Colors }) {
  const identity = worldBossIdentity(boss);
  const tone = tierTone(boss.tier, colors);
  const bossArt = typeof boss.image_url === 'string' && boss.image_url.trim() ? boss.image_url.trim() : null;
  const ownEncounters = encounters.filter((entry) => entry.world_boss_id === boss.id);
  const ownDamage = ownEncounters.length === 0
    ? null
    : ownEncounters.reduce<number | null>((total, entry) => {
        const damage = rewardNumber(entry.damage);
        return total === null || damage === null ? null : total + damage;
      }, 0);
  const lore = worldBossLore(boss);
  return (
    <View testID={`world-boss-${boss.id}`} style={[worldBossStyles.card, { backgroundColor: colors.panel, borderColor: `${tone}88` }]}>
      <View style={worldBossStyles.art}>
        {bossArt ? <Image source={{ uri: bossArt }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`Arte oficial de ${identity.name}`} /> : <View style={[StyleSheet.absoluteFill, worldBossStyles.missingArt, { borderColor: `${tone}55` }]}><Feather name="image" size={19} color={tone} /><Text style={[worldBossStyles.missingArtText, { color: tone }]}>ARTE DEL JEFE NO REPORTADO</Text></View>}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink, opacity: bossArt ? 0.38 : 0.82 }]} />
        <View style={[worldBossStyles.artCopy, { zIndex: 2 }]}>
          <Text style={[worldBossStyles.code, { color: tone }]}>{identity.code}</Text>
          <Text style={[worldBossStyles.title, { color: colors.foreground }]} numberOfLines={2}>{identity.name}</Text>
        </View>
        <View style={[worldBossStyles.tier, { backgroundColor: `${tone}22`, borderColor: `${tone}88` }]}><Text style={[worldBossStyles.tierText, { color: tone }]}>{identity.tier}</Text></View>
      </View>
      <View style={worldBossStyles.body}>
        <Text style={[worldBossStyles.lore, { color: lore === 'LORE NO REPORTADO' ? colors.accent : colors.mutedForeground }]} numberOfLines={2}>{lore}</Text>
        <View style={worldBossStyles.metaRow}><Text style={[worldBossStyles.metaText, { color: colors.mutedForeground }]}>{labelize(boss.region_id, 'REGIÓN NO REPORTADA')}</Text><Text style={[worldBossStyles.metaText, { color: tone }]}>{numberSignal(boss.power_level, 'PWR')}</Text></View>
        <View style={worldBossStyles.hpRow}><View style={[worldBossStyles.hpTrack, { backgroundColor: colors.muted }]}><View style={[worldBossStyles.hpFill, { width: '100%', backgroundColor: tone }]} /></View><Text style={[worldBossStyles.hpText, { color: colors.foreground }]}>{numberSignal(boss.hp, 'HP')}</Text></View>
        <View style={worldBossStyles.rewardRow}><Text style={[worldBossStyles.rewardText, { color: colors.accent }]}>{rewardText(boss.reward_pool)}</Text>{ownEncounters.length > 0 ? <Text style={[worldBossStyles.damageText, { color: ownDamage === null ? colors.accent : colors.success }]}>{ownDamage === null ? 'TÚ DAÑO NO REPORTADO' : `TÚ ${formatNumber(ownDamage)}`}</Text> : null}</View>
        <Pressable testID={`world-boss-battle-${boss.id}`} accessibilityRole="button" onPress={onBattle} style={({ pressed }) => [worldBossStyles.primaryButton, { backgroundColor: tone, opacity: pressed ? 0.72 : 1 }]}>
          <Feather name="crosshair" size={VISUAL_TOKENS.worldBoss.action.iconSize} color={colors.ink} /><Text style={[worldBossStyles.primaryButtonText, { color: colors.ink }]}>PREPARAR BATALLA</Text>
        </Pressable>
        <Text style={[worldBossStyles.integrityNote, { color: colors.mutedForeground }]}>Daño y recompensa sólo tras resolución oficial.</Text>
      </View>
    </View>
  );
}

const worldBossStyles = StyleSheet.create({
  card: { borderWidth: VISUAL_TOKENS.worldBoss.card.borderWidth, borderRadius: VISUAL_TOKENS.worldBoss.card.radius, overflow: 'hidden' },
  art: { height: VISUAL_TOKENS.worldBoss.art.height, position: 'relative', justifyContent: 'flex-end', padding: VISUAL_TOKENS.worldBoss.art.padding },
  missingArt: { alignItems: 'center', borderWidth: VISUAL_TOKENS.worldBoss.missingArt.borderWidth, justifyContent: 'center', gap: VISUAL_TOKENS.worldBoss.missingArt.gap, paddingHorizontal: VISUAL_TOKENS.worldBoss.missingArt.paddingHorizontal },
  missingArtText: { fontSize: VISUAL_TOKENS.worldBoss.missingArtText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.missingArtText.fontWeight, letterSpacing: VISUAL_TOKENS.worldBoss.missingArtText.letterSpacing, textAlign: 'center' },
  artCopy: { zIndex: 1, paddingRight: VISUAL_TOKENS.worldBoss.artCopy.paddingRight },
  code: { fontSize: VISUAL_TOKENS.worldBoss.code.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.code.fontWeight, letterSpacing: VISUAL_TOKENS.worldBoss.code.letterSpacing },
  title: { fontSize: VISUAL_TOKENS.worldBoss.title.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.title.fontWeight, marginTop: VISUAL_TOKENS.worldBoss.title.marginTop },
  tier: { position: 'absolute', right: VISUAL_TOKENS.worldBoss.tier.right, top: VISUAL_TOKENS.worldBoss.tier.top, paddingHorizontal: VISUAL_TOKENS.worldBoss.tier.paddingHorizontal, paddingVertical: VISUAL_TOKENS.worldBoss.tier.paddingVertical, borderRadius: VISUAL_TOKENS.worldBoss.tier.radius, borderWidth: VISUAL_TOKENS.worldBoss.tier.borderWidth },
  tierText: { fontSize: VISUAL_TOKENS.worldBoss.tierText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.tierText.fontWeight, letterSpacing: VISUAL_TOKENS.worldBoss.tierText.letterSpacing },
  body: { padding: VISUAL_TOKENS.worldBoss.body.padding, gap: VISUAL_TOKENS.worldBoss.body.gap },
  lore: { fontSize: VISUAL_TOKENS.worldBoss.lore.fontSize, lineHeight: VISUAL_TOKENS.worldBoss.lore.lineHeight },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: VISUAL_TOKENS.worldBoss.metaRow.gap },
  metaText: { fontSize: VISUAL_TOKENS.worldBoss.metaText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.metaText.fontWeight, letterSpacing: VISUAL_TOKENS.worldBoss.metaText.letterSpacing },
  hpRow: { flexDirection: 'row', alignItems: 'center', gap: VISUAL_TOKENS.worldBoss.hpRow.gap },
  hpTrack: { flex: 1, height: VISUAL_TOKENS.worldBoss.hpTrack.height, borderRadius: VISUAL_TOKENS.worldBoss.hpTrack.radius, overflow: 'hidden' },
  hpFill: { height: '100%', borderRadius: VISUAL_TOKENS.worldBoss.hpTrack.radius },
  hpText: { fontSize: VISUAL_TOKENS.worldBoss.hpText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.hpText.fontWeight },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: VISUAL_TOKENS.worldBoss.rewardRow.gap },
  rewardText: { flex: 1, fontSize: VISUAL_TOKENS.worldBoss.rewardText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.rewardText.fontWeight },
  damageText: { fontSize: VISUAL_TOKENS.worldBoss.damageText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.damageText.fontWeight },
  primaryButton: { minHeight: VISUAL_TOKENS.worldBoss.action.minHeight, borderRadius: VISUAL_TOKENS.worldBoss.action.radius, paddingHorizontal: VISUAL_TOKENS.worldBoss.action.paddingHorizontal, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: VISUAL_TOKENS.worldBoss.action.gap },
  primaryButtonText: { fontSize: VISUAL_TOKENS.worldBoss.actionText.fontSize, fontWeight: VISUAL_TOKENS.worldBoss.actionText.fontWeight, letterSpacing: VISUAL_TOKENS.worldBoss.actionText.letterSpacing },
  integrityNote: { fontSize: VISUAL_TOKENS.worldBoss.integrityNote.fontSize, lineHeight: VISUAL_TOKENS.worldBoss.integrityNote.lineHeight, textAlign: 'center' },
});

function RaidCard({ raid, joined, busy, onJoin, onContribute, colors }: { raid: MobileRaidRun; joined: boolean; busy: boolean; onJoin: () => void; onContribute: () => void; colors: Colors }) {
  const identity = worldRaidIdentity(raid);
  const difficulty = raid.metadata?.difficulty;
  const tone = difficultyTone(difficulty, colors);
  return (
    <View testID={`world-raid-${raid.id}`} style={[worldRaidStyles.card, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={[worldRaidStyles.stripe, { backgroundColor: tone }]} />
       <View style={worldRaidStyles.header}><View style={worldRaidStyles.icon}><Feather name="people" size={VISUAL_TOKENS.worldRaid.icon.size} color={tone} /></View><View style={worldRaidStyles.copy}><Text style={[worldRaidStyles.title, { color: colors.foreground }]} numberOfLines={2}>{identity.name}</Text><Text style={[worldRaidStyles.metaText, { color: colors.mutedForeground }]}>{labelize(raid.region_id, 'REGIÓN NO REPORTADA')} · {worldStatusLabel(raid.status)}</Text></View><Text style={[worldRaidStyles.difficulty, { color: tone }]}>{difficulty ? difficulty.toUpperCase() : 'DIFICULTAD NO REPORTADA'}</Text></View>
       <View style={worldRaidStyles.stats}><Text style={[worldRaidStyles.metaText, { color: colors.mutedForeground }]}>{numberSignal(raid.metadata?.max_participants, 'LÍMITE')}</Text><Text style={[worldRaidStyles.metaText, { color: colors.accent }]}>{typeof raid.metadata?.reward_multiplier === 'number' ? `x${raid.metadata.reward_multiplier} recompensa` : 'MULTIPLICADOR NO REPORTADO'}</Text><Text style={[worldRaidStyles.metaText, { color: colors.mutedForeground }]}>{formatDate(raid.started_at ?? raid.created_at)}</Text></View>
       <Text style={[worldRaidStyles.code, { color: colors.mutedForeground }]}>{identity.code}</Text>
      <Pressable testID={`world-raid-action-${raid.id}`} accessibilityRole="button" disabled={busy} onPress={joined ? onContribute : onJoin} style={({ pressed }) => [worldRaidStyles.action, { borderColor: tone, opacity: pressed ? 0.7 : busy ? 0.5 : 1 }]}>
        {busy ? <ActivityIndicator size="small" color={tone} /> : <Feather name={joined ? 'zap' : 'arrow-forward'} size={VISUAL_TOKENS.worldRaid.action.iconSize} color={tone} />}
        <Text style={[worldRaidStyles.actionText, { color: tone }]}>{busy ? 'SINCRONIZANDO' : joined ? 'CONTRIBUIR AL RAID' : 'UNIRSE AL RAID'}</Text>
      </Pressable>
      <Text style={[worldRaidStyles.integrityNote, { color: colors.mutedForeground }]}>{joined ? 'Tu contribución será validada por el RPC oficial.' : 'La participación se registra con la sesión del Nexus.'}</Text>
    </View>
  );
}

const worldRaidStyles = StyleSheet.create({
  card: { position: 'relative', overflow: 'hidden', borderWidth: VISUAL_TOKENS.worldRaid.card.borderWidth, borderRadius: VISUAL_TOKENS.worldRaid.card.radius, padding: VISUAL_TOKENS.worldRaid.card.padding, gap: VISUAL_TOKENS.worldRaid.card.gap },
  stripe: { position: 'absolute', left: 0, right: 0, top: 0, height: VISUAL_TOKENS.worldRaid.stripe.height },
  header: { flexDirection: 'row', alignItems: 'center', gap: VISUAL_TOKENS.worldRaid.header.gap },
  icon: { width: VISUAL_TOKENS.worldRaid.icon.size, height: VISUAL_TOKENS.worldRaid.icon.size, borderRadius: VISUAL_TOKENS.worldRaid.icon.radius, borderWidth: VISUAL_TOKENS.worldRaid.icon.borderWidth, borderColor: VISUAL_TOKENS.worldRaid.icon.borderColor, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: VISUAL_TOKENS.worldRaid.title.fontSize, fontWeight: VISUAL_TOKENS.worldRaid.title.fontWeight, lineHeight: VISUAL_TOKENS.worldRaid.title.lineHeight },
  metaText: { fontSize: VISUAL_TOKENS.worldRaid.metaText.fontSize, fontWeight: VISUAL_TOKENS.worldRaid.metaText.fontWeight, letterSpacing: VISUAL_TOKENS.worldRaid.metaText.letterSpacing },
  difficulty: { fontSize: VISUAL_TOKENS.worldRaid.difficulty.fontSize, fontWeight: VISUAL_TOKENS.worldRaid.difficulty.fontWeight, letterSpacing: VISUAL_TOKENS.worldRaid.difficulty.letterSpacing },
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: VISUAL_TOKENS.worldRaid.stats.gap, flexWrap: 'wrap' },
  code: { fontSize: VISUAL_TOKENS.worldRaid.code.fontSize, letterSpacing: VISUAL_TOKENS.worldRaid.code.letterSpacing },
  action: { minHeight: VISUAL_TOKENS.worldRaid.action.minHeight, borderWidth: VISUAL_TOKENS.worldRaid.action.borderWidth, borderRadius: VISUAL_TOKENS.worldRaid.action.radius, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: VISUAL_TOKENS.worldRaid.action.gap },
  actionText: { fontSize: VISUAL_TOKENS.worldRaid.actionText.fontSize, fontWeight: VISUAL_TOKENS.worldRaid.actionText.fontWeight, letterSpacing: VISUAL_TOKENS.worldRaid.actionText.letterSpacing },
  integrityNote: { fontSize: VISUAL_TOKENS.worldRaid.integrityNote.fontSize, lineHeight: VISUAL_TOKENS.worldRaid.integrityNote.lineHeight, textAlign: 'center' },
});

function LoreCard({ entry, expanded, onToggle, colors }: { entry: MobileLoreEntry; expanded: boolean; onToggle: () => void; colors: Colors }) {
  return (
    <Pressable testID={`world-lore-${entry.id}`} accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [worldLoreStyles.card, { backgroundColor: colors.panel, borderColor: expanded ? colors.accent : colors.border, opacity: pressed ? 0.78 : 1 }]}>
       <View style={worldLoreStyles.header}><View style={[worldLoreStyles.seal, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}12` }]}><Feather name="lore" size={VISUAL_TOKENS.worldLore.iconSize} color={colors.accent} /></View><View style={worldLoreStyles.copy}><Text style={[worldLoreStyles.category, { color: colors.accent }]}>{labelize(entry.category, 'CATEGORÍA NO REPORTADA')}</Text><Text style={[worldLoreStyles.title, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 2}>{loreTitle(entry)}</Text></View><Feather name={expanded ? 'arrow-up' : 'arrow-down'} size={VISUAL_TOKENS.worldLore.iconSize} color={colors.mutedForeground} /></View>
       {expanded ? <><Text style={[worldLoreStyles.content, { color: colors.mutedForeground }]}>{loreContent(entry.content)}</Text>{entry.related_entity ? <Text style={[worldLoreStyles.related, { color: colors.accent }]}>VINCULADO · {entry.related_entity}</Text> : null}</> : <Text style={[worldLoreStyles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>{loreContent(entry.content)}</Text>}
    </Pressable>
  );
}

const worldLoreStyles = StyleSheet.create({
  card: { borderWidth: VISUAL_TOKENS.worldLore.card.borderWidth, borderRadius: VISUAL_TOKENS.worldLore.card.radius, padding: VISUAL_TOKENS.worldLore.card.padding, gap: VISUAL_TOKENS.worldLore.card.gap },
  header: { flexDirection: 'row', alignItems: 'center', gap: VISUAL_TOKENS.worldLore.header.gap },
  seal: { width: VISUAL_TOKENS.worldLore.seal.size, height: VISUAL_TOKENS.worldLore.seal.size, borderRadius: VISUAL_TOKENS.worldLore.seal.radius, borderWidth: VISUAL_TOKENS.worldLore.seal.borderWidth, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  category: { fontSize: VISUAL_TOKENS.worldLore.category.fontSize, fontWeight: VISUAL_TOKENS.worldLore.category.fontWeight, letterSpacing: VISUAL_TOKENS.worldLore.category.letterSpacing },
  title: { fontSize: VISUAL_TOKENS.worldLore.title.fontSize, fontWeight: VISUAL_TOKENS.worldLore.title.fontWeight, marginTop: VISUAL_TOKENS.worldLore.title.marginTop },
  preview: { fontSize: VISUAL_TOKENS.worldLore.preview.fontSize, lineHeight: VISUAL_TOKENS.worldLore.preview.lineHeight },
  content: { fontSize: VISUAL_TOKENS.worldLore.content.fontSize, lineHeight: VISUAL_TOKENS.worldLore.content.lineHeight },
  related: { fontSize: VISUAL_TOKENS.worldLore.related.fontSize, fontWeight: VISUAL_TOKENS.worldLore.related.fontWeight, letterSpacing: VISUAL_TOKENS.worldLore.related.letterSpacing },
});

function SeasonPanel({ snapshot, session, onChanged, colors }: { snapshot: MobileWorldSnapshot; session: ReturnType<typeof useGame>['session']; onChanged: () => void; colors: Colors }) {
  const [claiming, setClaiming] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const progress = snapshot.seasonProgress;
  const tiers = snapshot.seasonTiers.slice(0, 20);
  const xp = typeof progress?.player_xp === 'number' && Number.isFinite(progress.player_xp) ? progress.player_xp : null;
  const currentTier = typeof progress?.current_tier === 'number' && Number.isFinite(progress.current_tier) ? progress.current_tier : null;
  const nextTier = currentTier === null ? undefined : tiers.find((tier) => tier.tier > currentTier);
  const percent = nextTier && xp !== null ? Math.min(100, Math.round((xp / Math.max(1, nextTier.xp_required)) * 100)) : currentTier !== null && currentTier > 0 ? 100 : null;
  const passStatus = progress?.is_premium === true ? 'Pase premium activo' : progress?.is_premium === false ? 'Ruta gratuita' : 'Pase no confirmado';
  const handleClaim = async (tier: MobileSeasonTier) => {
    setClaiming(tier.tier); setNotice(null);
    const result = await claimWorldSeasonTier(tier.tier, session ?? undefined);
    if (result.ok) { setNotice(`Tier ${tier.tier} reclamado.`); onChanged(); } else setNotice(result.reason ?? 'No se pudo reclamar el tier.');
    setClaiming(null);
  };
  if (!snapshot.season) return <EmptyState icon="time" title="Sin temporada activa" copy="No hay un pase de temporada publicado en este momento." colors={colors} />;
  return <View style={styles.panelStack}>
     <View style={[styles.seasonHero, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><Text style={[styles.eyebrow, { color: colors.accent }]}>TEMPORADA {snapshot.season.season_number}</Text><Text style={[styles.seasonTitle, { color: colors.foreground }]}>{snapshot.season.name}</Text><Text style={[styles.copy, { color: colors.mutedForeground }]}>Disponible hasta {formatDate(snapshot.season.end_at)} · {passStatus}</Text><View style={styles.progressTop}><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{numberSignal(xp, 'XP')}</Text><Text style={[styles.metaText, { color: colors.accent }]}>{numberSignal(currentTier, 'TIER')}</Text></View>{percent !== null ? <ProgressBar value={percent} color={colors.accent} /> : <Text style={[styles.integrityNote, { color: colors.accent }]}>PROGRESO DE TEMPORADA NO REPORTADO</Text>}</View>
    {!session ? <View style={[styles.notice, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}12` }]}><Feather name="lock" size={16} color={colors.accent} /><Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Inicia sesión para sincronizar progreso y reclamar recompensas.</Text></View> : null}
    {notice ? <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.panel }]}><Feather name="radio" size={16} color={colors.accent} /><Text style={[styles.noticeText, { color: colors.foreground }]}>{notice}</Text></View> : null}
     {tiers.length === 0 ? <EmptyState icon="award" title="Sin tiers configurados" copy="La temporada está publicada, pero aún no tiene recompensas disponibles." colors={colors} /> : tiers.map((tier) => {
       const canClaim = Boolean(session && tier.unlocked && !tier.claimed && !(tier.is_premium && !progress?.is_premium));
       return (
         <View
           key={`${tier.tier}-${tier.is_premium}`}
           style={[styles.tierRow, { backgroundColor: colors.panel, borderColor: tier.unlocked ? colors.accent : colors.border }]}
         >
           <View style={[styles.tierNumber, { borderColor: tier.unlocked ? colors.accent : colors.border }]}>
             <Text style={[styles.tierNumberText, { color: tier.unlocked ? colors.accent : colors.mutedForeground }]}>{tier.tier}</Text>
           </View>
           <View style={styles.tierCopy}>
             <Text style={[styles.tierLabel, { color: colors.foreground }]}>{tier.is_premium ? 'PREMIUM' : 'GRATIS'} · {numberSignal(tier.xp_required, 'XP')}</Text>
             <Text style={[styles.tierReward, { color: colors.mutedForeground }]}>{rewardText(tier.reward)}</Text>
           </View>
           {tier.claimed ? (
             <Feather name="check-circle" size={18} color={colors.success} />
           ) : canClaim ? (
             <Pressable
               testID={`world-season-claim-${tier.tier}`}
               accessibilityRole="button"
               disabled={claiming === tier.tier}
               onPress={() => { void handleClaim(tier); }}
               style={[styles.claimButton, { backgroundColor: colors.accent }]}
             >
               {claiming === tier.tier ? (
                 <ActivityIndicator size="small" color={colors.ink} />
               ) : (
                 <Text style={[styles.claimText, { color: colors.ink }]}>RECLAMAR</Text>
               )}
             </Pressable>
           ) : (
             <Feather name={tier.is_premium && !progress?.is_premium ? 'lock' : 'clock'} size={16} color={colors.mutedForeground} />
           )}
         </View>
       );
     })}
  </View>;
}

function EmptyState({ icon, title, copy, colors }: { icon: keyof typeof Feather.glyphMap; title: string; copy: string; colors: Colors }) {
  void colors;
  return <DomainState kind="empty" title={title} message={copy} testID={`world-empty-${String(icon)}`} />;
}

export default function WorldScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useGame();
  const [panel, setPanel] = useState<Panel>('bosses');
  const [snapshot, setSnapshot] = useState<MobileWorldSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedLore, setExpandedLore] = useState<string | null>(null);
  const [busyRaid, setBusyRaid] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try { setSnapshot(await loadWorldSnapshot(session ?? undefined)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo sincronizar el mundo oficial.'); } finally { setLoading(false); setRefreshing(false); }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const handleRaidAction = async (raid: MobileRaidRun, joined: boolean) => {
    setBusyRaid(raid.id); setActionNotice(null);
    const result = joined ? await contributeWorldRaid(raid.id, session ?? undefined) : await joinWorldRaid(raid.id, session ?? undefined);
    if (result.ok) { setActionNotice(joined ? 'Contribución registrada por el servidor.' : 'Te has unido al raid.'); await load(true); } else setActionNotice(result.reason ?? 'La acción fue rechazada por el servidor.');
    setBusyRaid(null);
  };

  const lore = useMemo(() => { const query = search.trim().toLowerCase(); return (snapshot?.lore ?? []).filter((entry) => !query || [entry.title, entry.content, entry.category, entry.related_entity].filter(Boolean).join(' ').toLowerCase().includes(query)); }, [search, snapshot?.lore]);
  const rankings = snapshot?.rankings ?? [];
  const myPlayerId = session?.user.id;

  return <ScreenShell surface="world"><ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 108 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} tintColor={colors.accent} />} showsVerticalScrollIndicator={false}>
    <WorldHeader panel={panel} onPanelChange={setPanel} onRefresh={() => { void load(true); }} refreshing={refreshing} colors={colors} />
    <View style={styles.content}>
       {loading && !snapshot ? <DomainState kind="loading" title="Abriendo rutas del mundo" message="El Nexus está sincronizando jefes, raids, lore y temporada." testID="world-loading" /> : null}
       {error && !snapshot ? <DomainState kind="error" title="El mundo no responde" message={error} actionLabel="REINTENTAR SINCRONIZACIÓN" onAction={() => { void load(); }} testID="world-error" /> : null}
      {snapshot && panel === 'bosses' ? <View style={styles.panelStack}><View style={styles.sectionHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>FRONTE PVE</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Jefes mundiales</Text></View><Text style={[styles.counter, { color: colors.mutedForeground }]}>{snapshot.bosses.length} ACTIVOS</Text></View><Text style={[styles.copy, { color: colors.mutedForeground }]}>Elige un frente para preparar tu formación. La resolución y el daño permanecen en Battle Run y Supabase.</Text>{snapshot.bosses.length ? snapshot.bosses.map((boss) => <BossCard key={boss.id} boss={boss} encounters={snapshot.encounters} onBattle={() => router.push('/battle')} colors={colors} />) : <EmptyState icon="target" title="Sin jefes activos" copy="No hay un frente publicado en este momento." colors={colors} />}</View> : null}
      {snapshot && panel === 'raids' ? <View style={styles.panelStack}><View style={styles.sectionHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>COOPERACIÓN PVE</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Raids en curso</Text></View><Text style={[styles.counter, { color: colors.mutedForeground }]}>{snapshot.raids.length} ABIERTOS</Text></View>{actionNotice ? <View style={[styles.notice, { borderColor: colors.accent, backgroundColor: `${colors.accent}12` }]}><Feather name="radio" size={16} color={colors.accent} /><Text style={[styles.noticeText, { color: colors.foreground }]}>{actionNotice}</Text></View> : null}{snapshot.raids.length ? snapshot.raids.map((raid) => { const joined = snapshot.myRaidIds.includes(raid.id); return <RaidCard key={raid.id} raid={raid} joined={joined} busy={busyRaid === raid.id} onJoin={() => { void handleRaidAction(raid, false); }} onContribute={() => { void handleRaidAction(raid, true); }} colors={colors} />; }) : <EmptyState icon="people" title="Sin raids abiertos" copy="La red cooperativa no tiene incursiones pendientes." colors={colors} />}</View> : null}
      {snapshot && panel === 'lore' ? <View style={styles.panelStack}><Text style={[styles.eyebrow, { color: colors.accent }]}>ARCHIVO CANÓNICO</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Codex de Lore</Text><Text style={[styles.copy, { color: colors.mutedForeground }]}>La Ruptura, las facciones y las reglas que sostienen la Forja.</Text><View style={[styles.searchBox, { backgroundColor: colors.panel, borderColor: colors.border }]}><Feather name="search" size={16} color={colors.mutedForeground} /><TextInput testID="world-lore-search" value={search} onChangeText={setSearch} placeholder="Buscar en el Codex…" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} /></View><Text style={[styles.counter, { color: colors.mutedForeground }]}>{lore.length} DE {snapshot.lore.length} ENTRADAS</Text>{lore.length ? lore.map((entry) => <LoreCard key={entry.id} entry={entry} expanded={expandedLore === entry.id} onToggle={() => setExpandedLore((value) => value === entry.id ? null : entry.id)} colors={colors} />) : <EmptyState icon="search" title="No hay coincidencias" copy="Prueba con otra búsqueda o limpia el filtro." colors={colors} />}</View> : null}
      {snapshot && panel === 'season' ? <SeasonPanel snapshot={snapshot} session={session} onChanged={() => { void load(true); }} colors={colors} /> : null}
        {snapshot && panel === 'rankings' ? <View style={styles.panelStack}><Text style={[styles.eyebrow, { color: colors.accent }]}>TEMPORADA {rankingSeasonLabel(rankings[0]?.season_key)}</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ranking del mundo</Text><Text style={[styles.copy, { color: colors.mutedForeground }]}>Clasificación pública con nombres resueltos por el RPC oficial.</Text>{rankings.length ? rankings.map((entry) => { const rankPosition = typeof entry.rank_position === 'number' && Number.isFinite(entry.rank_position) ? entry.rank_position : null; const winRate = rankingWinRate(entry.wins, entry.losses, entry.draws); return <View key={`${entry.season_key}-${entry.player_id}`} style={[styles.rankRow, { backgroundColor: colors.panel, borderColor: entry.player_id === myPlayerId ? colors.primary : colors.border }]}><Text style={[styles.rankNumber, { color: rankPosition !== null && rankPosition <= 3 ? colors.accent : colors.mutedForeground }]}>{rankPosition !== null ? `#${rankPosition}` : 'PUESTO NO REPORTADO'}</Text><View style={styles.rankCopy}><Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{rankingName(entry.display_name)}{entry.player_id === myPlayerId ? ' · TÚ' : ''}</Text><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{rankingMetric(entry.mmr, 'MMR')} MMR · {rankingMetric(entry.wins, 'VICTORIAS')}V / {rankingMetric(entry.losses, 'DERROTAS')}D / {rankingMetric(entry.draws, 'EMPATES')}E</Text></View><Text style={[styles.winRate, { color: colors.success }]}>{winRate}</Text></View>; }) : <EmptyState icon="rankings" title="Ranking en espera" copy="Aún no hay registros para esta temporada." colors={colors} />}</View> : null}
    </View>
  </ScrollView></ScreenShell>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 17, gap: 13 }, header: { paddingHorizontal: 17, gap: 13 }, headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headerCopy: { flex: 1 }, headerSeal: { width: 43, height: 43, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, refreshButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.45 }, title: { fontSize: 27, fontWeight: '800', marginTop: 3 }, sectionTitle: { fontSize: 21, fontWeight: '800', marginTop: 4 }, copy: { fontSize: 12, lineHeight: 18 }, tabs: { gap: 8, paddingVertical: 3, paddingRight: 12 }, tab: { minHeight: 38, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, tabText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.45 }, tabOverlay: { position: 'absolute', top: 110, left: 17, right: 17, height: 39, flexDirection: 'row', gap: 8, zIndex: -1 }, hiddenTabAction: { flex: 1 }, panelStack: { gap: 12 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, counter: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9 }, loading: { minHeight: 250, alignItems: 'center', justifyContent: 'center', gap: 14 }, error: { borderWidth: 1, borderRadius: 13, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'center' }, errorText: { flex: 1, fontSize: 12, lineHeight: 18 }, bossCard: { borderWidth: 1, borderRadius: 17, overflow: 'hidden' }, bossArt: { height: 148, position: 'relative', justifyContent: 'flex-end', padding: 14 }, missingBossArt: { alignItems: 'center', borderWidth: 1, justifyContent: 'center', gap: 7, paddingHorizontal: 18 }, missingBossArtText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' }, bossArtCopy: { zIndex: 1, paddingRight: 76 }, bossCode: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, bossTitle: { fontSize: 20, fontWeight: '900', marginTop: 5 }, tierPill: { position: 'absolute', right: 13, top: 13, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 }, tierText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, bossBody: { padding: 14, gap: 10 }, bossLore: { fontSize: 12, lineHeight: 18 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, metaText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.45 }, hpRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, hpTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden' }, hpFill: { height: '100%', borderRadius: 4 }, hpText: { fontSize: 10, fontWeight: '800' }, rewardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, rewardText: { flex: 1, fontSize: 10, fontWeight: '800' }, damageText: { fontSize: 10, fontWeight: '800' }, primaryButton: { minHeight: 45, borderRadius: 11, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, primaryButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }, integrityNote: { fontSize: 9, lineHeight: 14, textAlign: 'center' }, raidCard: { position: 'relative', overflow: 'hidden', borderWidth: 1, borderRadius: 16, padding: 14, gap: 11 }, raidStripe: { position: 'absolute', left: 0, right: 0, top: 0, height: 3 }, raidHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, raidIcon: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, raidCopy: { flex: 1 }, raidTitle: { fontSize: 15, fontWeight: '800', lineHeight: 19 }, difficulty: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, raidStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' }, raidCode: { fontSize: 9, letterSpacing: 1 }, secondaryButton: { minHeight: 43, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, secondaryButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, loreCard: { borderWidth: 1, borderRadius: 15, padding: 13, gap: 10 }, loreHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, loreSeal: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, loreCopy: { flex: 1 }, loreCategory: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, loreTitle: { fontSize: 15, fontWeight: '800', marginTop: 3 }, lorePreview: { fontSize: 11, lineHeight: 17 }, loreContent: { fontSize: 12, lineHeight: 19 }, loreRelated: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, searchBox: { borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, fontSize: 12, paddingVertical: 9 }, seasonHero: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 }, seasonTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800' }, progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }, notice: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'center' }, noticeText: { flex: 1, fontSize: 11, lineHeight: 17 }, tierRow: { minHeight: 66, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, tierNumber: { width: 37, height: 37, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, tierNumberText: { fontSize: 14, fontWeight: '900' }, tierCopy: { flex: 1 }, tierLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, tierReward: { fontSize: 11, marginTop: 4 }, claimButton: { minHeight: 31, borderRadius: 8, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' }, claimText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }, rankRow: { minHeight: 64, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, rankNumber: { width: 34, fontSize: 15, fontWeight: '900' }, rankCopy: { flex: 1 }, rankName: { fontSize: 13, fontWeight: '800' }, winRate: { fontSize: 13, fontWeight: '900' }, empty: { borderWidth: 1, borderRadius: 15, padding: 26, alignItems: 'center', gap: 9 }, emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' }, emptyCopy: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
