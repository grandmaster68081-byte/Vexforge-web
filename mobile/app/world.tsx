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
  const value = tier.toLowerCase();
  if (value.includes('6') || value === 'legendary') return colors.danger;
  if (value.includes('5') || value === 'epic') return colors.rarityEpic;
  if (value.includes('4') || value === 'rare') return colors.primary;
  return colors.accent;
}

function difficultyTone(difficulty: string | undefined, colors: Colors) {
  if (difficulty === 'hard') return colors.rarityEpic;
  if (difficulty === 'easy') return colors.success;
  return colors.primary;
}

function labelize(value: string | null | undefined) {
  return (value ?? 'sin clasificar').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-ES');
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

function rewardText(reward: Record<string, unknown> | undefined) {
  if (!reward) return 'Recompensa registrada';
  const parts: string[] = [];
  if (Number(reward.vex_ingame ?? 0) > 0) parts.push(`${formatNumber(Number(reward.vex_ingame))} VEX`);
  if (Number(reward.shards ?? 0) > 0) parts.push(`${formatNumber(Number(reward.shards))} fragmentos`);
  if (reward.card_rarity) parts.push(`carta ${String(reward.card_rarity)}`);
  return parts.join(' · ') || 'Recompensa registrada';
}

function WorldHeader({ panel, onPanelChange, onRefresh, refreshing, colors }: { panel: Panel; onPanelChange: (panel: Panel) => void; onRefresh: () => void; refreshing: boolean; colors: Colors }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={[styles.headerSeal, { backgroundColor: `${colors.accent}14`, borderColor: `${colors.accent}88` }]}>
          <Feather name="globe" size={19} color={colors.accent} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>VEXFORGE / WORLD</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Mundo navegable</Text>
        </View>
        <Pressable testID="world-refresh" accessibilityRole="button" accessibilityLabel="Actualizar mundo" onPress={onRefresh} style={({ pressed }) => [styles.refreshButton, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
          {refreshing ? <ActivityIndicator size="small" color={colors.accent} /> : <Feather name="refresh" size={17} color={colors.foreground} />}
        </Pressable>
      </View>
      <Text style={[styles.copy, { color: colors.mutedForeground }]}>Explora los frentes vivos, las incursiones cooperativas, el Codex y el pulso competitivo de la temporada.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {PANELS.map((item) => {
          const active = item.id === panel;
          return (
            <Pressable key={item.id} testID={`world-tab-${item.id}`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onPanelChange(item.id)} style={[styles.tab, { backgroundColor: active ? `${colors.accent}18` : colors.panel, borderColor: active ? colors.accent : colors.border }]}>
              <Feather name={item.icon} size={14} color={active ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: active ? colors.accent : colors.mutedForeground }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function BossCard({ boss, encounters, onBattle, colors }: { boss: MobileWorldBoss; encounters: MobileBossEncounter[]; onBattle: () => void; colors: Colors }) {
  const tone = tierTone(boss.tier, colors);
  const ownDamage = encounters.filter((entry) => entry.world_boss_id === boss.id).reduce((total, entry) => total + Number(entry.damage ?? 0), 0);
  const lore = typeof boss.metadata?.lore === 'string' ? boss.metadata.lore : 'Un frente activo del mundo fracturado.';
  return (
    <View testID={`world-boss-${boss.id}`} style={[styles.bossCard, { backgroundColor: colors.panel, borderColor: `${tone}88` }]}>
      <View style={styles.bossArt}>
        {boss.image_url ? <Image source={{ uri: boss.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`Arte oficial de ${boss.name}`} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink, opacity: boss.image_url ? 0.38 : 0.82 }]} />
        <View style={styles.bossArtCopy}>
          <Text style={[styles.bossCode, { color: tone }]}>{boss.boss_code}</Text>
          <Text style={[styles.bossTitle, { color: colors.foreground }]} numberOfLines={2}>{boss.name}</Text>
        </View>
        <View style={[styles.tierPill, { backgroundColor: `${tone}22`, borderColor: `${tone}88` }]}><Text style={[styles.tierText, { color: tone }]}>{boss.tier.toUpperCase()}</Text></View>
      </View>
      <View style={styles.bossBody}>
        <Text style={[styles.bossLore, { color: colors.mutedForeground }]} numberOfLines={2}>{lore}</Text>
        <View style={styles.metaRow}><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{labelize(boss.region_id)}</Text><Text style={[styles.metaText, { color: tone }]}>PWR {formatNumber(boss.power_level)}</Text></View>
        <View style={styles.hpRow}><View style={[styles.hpTrack, { backgroundColor: colors.muted }]}><View style={[styles.hpFill, { width: '100%', backgroundColor: tone }]} /></View><Text style={[styles.hpText, { color: colors.foreground }]}>{formatNumber(boss.hp)} HP</Text></View>
        <View style={styles.rewardRow}><Text style={[styles.rewardText, { color: colors.accent }]}>{rewardText(boss.reward_pool)}</Text>{ownDamage > 0 ? <Text style={[styles.damageText, { color: colors.success }]}>Tú {formatNumber(ownDamage)}</Text> : null}</View>
        <Pressable testID={`world-boss-battle-${boss.id}`} accessibilityRole="button" onPress={onBattle} style={({ pressed }) => [styles.primaryButton, { backgroundColor: tone, opacity: pressed ? 0.72 : 1 }]}>
          <Feather name="crosshair" size={15} color={colors.ink} /><Text style={[styles.primaryButtonText, { color: colors.ink }]}>PREPARAR BATALLA</Text>
        </Pressable>
        <Text style={[styles.integrityNote, { color: colors.mutedForeground }]}>Daño y recompensa sólo tras resolución oficial.</Text>
      </View>
    </View>
  );
}

function RaidCard({ raid, joined, busy, onJoin, onContribute, colors }: { raid: MobileRaidRun; joined: boolean; busy: boolean; onJoin: () => void; onContribute: () => void; colors: Colors }) {
  const difficulty = raid.metadata?.difficulty ?? 'normal';
  const tone = difficultyTone(difficulty, colors);
  return (
    <View testID={`world-raid-${raid.id}`} style={[styles.raidCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={[styles.raidStripe, { backgroundColor: tone }]} />
      <View style={styles.raidHeader}><View style={styles.raidIcon}><Feather name="people" size={18} color={tone} /></View><View style={styles.raidCopy}><Text style={[styles.raidTitle, { color: colors.foreground }]} numberOfLines={2}>{raid.metadata?.name ?? raid.raid_code}</Text><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{labelize(raid.region_id)} · {raid.status.toUpperCase()}</Text></View><Text style={[styles.difficulty, { color: tone }]}>{difficulty.toUpperCase()}</Text></View>
      <View style={styles.raidStats}><Text style={[styles.metaText, { color: colors.mutedForeground }]}>Límite {raid.metadata?.max_participants ?? '∞'}</Text><Text style={[styles.metaText, { color: colors.accent }]}>x{raid.metadata?.reward_multiplier ?? 1} recompensa</Text><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(raid.started_at ?? raid.created_at)}</Text></View>
      <Text style={[styles.raidCode, { color: colors.mutedForeground }]}>{raid.raid_code}</Text>
      <Pressable testID={`world-raid-action-${raid.id}`} accessibilityRole="button" disabled={busy} onPress={joined ? onContribute : onJoin} style={({ pressed }) => [styles.secondaryButton, { borderColor: tone, opacity: pressed ? 0.7 : busy ? 0.5 : 1 }]}>
        {busy ? <ActivityIndicator size="small" color={tone} /> : <Feather name={joined ? 'zap' : 'arrow-forward'} size={15} color={tone} />}
        <Text style={[styles.secondaryButtonText, { color: tone }]}>{busy ? 'SINCRONIZANDO' : joined ? 'CONTRIBUIR AL RAID' : 'UNIRSE AL RAID'}</Text>
      </Pressable>
      <Text style={[styles.integrityNote, { color: colors.mutedForeground }]}>{joined ? 'Tu contribución será validada por el RPC oficial.' : 'La participación se registra con la sesión del Nexus.'}</Text>
    </View>
  );
}

function LoreCard({ entry, expanded, onToggle, colors }: { entry: MobileLoreEntry; expanded: boolean; onToggle: () => void; colors: Colors }) {
  return (
    <Pressable testID={`world-lore-${entry.id}`} accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.loreCard, { backgroundColor: colors.panel, borderColor: expanded ? colors.accent : colors.border, opacity: pressed ? 0.78 : 1 }]}>
      <View style={styles.loreHeader}><View style={[styles.loreSeal, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}12` }]}><Feather name="lore" size={17} color={colors.accent} /></View><View style={styles.loreCopy}><Text style={[styles.loreCategory, { color: colors.accent }]}>{labelize(entry.category)}</Text><Text style={[styles.loreTitle, { color: colors.foreground }]} numberOfLines={expanded ? undefined : 2}>{entry.title ?? entry.entry_code ?? 'Entrada sin título'}</Text></View><Feather name={expanded ? 'arrow-up' : 'arrow-down'} size={17} color={colors.mutedForeground} /></View>
      {expanded ? <><Text style={[styles.loreContent, { color: colors.mutedForeground }]}>{entry.content ?? 'Esta entrada aún no tiene texto.'}</Text>{entry.related_entity ? <Text style={[styles.loreRelated, { color: colors.accent }]}>VINCULADO · {entry.related_entity}</Text> : null}</> : <Text style={[styles.lorePreview, { color: colors.mutedForeground }]} numberOfLines={2}>{entry.content ?? 'Toca para abrir la entrada.'}</Text>}
    </Pressable>
  );
}

function SeasonPanel({ snapshot, session, onChanged, colors }: { snapshot: MobileWorldSnapshot; session: ReturnType<typeof useGame>['session']; onChanged: () => void; colors: Colors }) {
  const [claiming, setClaiming] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const progress = snapshot.seasonProgress;
  const tiers = snapshot.seasonTiers.slice(0, 20);
  const xp = Number(progress?.player_xp ?? 0);
  const currentTier = Number(progress?.current_tier ?? 0);
  const nextTier = tiers.find((tier) => tier.tier > currentTier);
  const percent = nextTier ? Math.min(100, Math.round((xp / Math.max(1, nextTier.xp_required)) * 100)) : currentTier > 0 ? 100 : 0;
  const handleClaim = async (tier: MobileSeasonTier) => {
    setClaiming(tier.tier); setNotice(null);
    const result = await claimWorldSeasonTier(tier.tier, session ?? undefined);
    if (result.ok) { setNotice(`Tier ${tier.tier} reclamado.`); onChanged(); } else setNotice(result.reason ?? 'No se pudo reclamar el tier.');
    setClaiming(null);
  };
  if (!snapshot.season) return <EmptyState icon="time" title="Sin temporada activa" copy="No hay un pase de temporada publicado en este momento." colors={colors} />;
  return <View style={styles.panelStack}>
    <View style={[styles.seasonHero, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><Text style={[styles.eyebrow, { color: colors.accent }]}>TEMPORADA {snapshot.season.season_number}</Text><Text style={[styles.seasonTitle, { color: colors.foreground }]}>{snapshot.season.name}</Text><Text style={[styles.copy, { color: colors.mutedForeground }]}>Disponible hasta {formatDate(snapshot.season.end_at)} · {progress?.is_premium ? 'Pase premium activo' : 'Ruta gratuita'}</Text><View style={styles.progressTop}><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatNumber(xp)} XP</Text><Text style={[styles.metaText, { color: colors.accent }]}>TIER {currentTier}</Text></View><ProgressBar value={percent} color={colors.accent} /></View>
    {!session ? <View style={[styles.notice, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}12` }]}><Feather name="lock" size={16} color={colors.accent} /><Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Inicia sesión para sincronizar progreso y reclamar recompensas.</Text></View> : null}
    {notice ? <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.panel }]}><Feather name="radio" size={16} color={colors.accent} /><Text style={[styles.noticeText, { color: colors.foreground }]}>{notice}</Text></View> : null}
    {tiers.length === 0 ? <EmptyState icon="award" title="Sin tiers configurados" copy="La temporada está publicada, pero aún no tiene recompensas disponibles." colors={colors} /> : tiers.map((tier) => {
      const canClaim = Boolean(session && tier.unlocked && !tier.claimed && !(tier.is_premium && !progress?.is_premium));
      return <View key={`${tier.tier}-${tier.is_premium}`} style={[styles.tierRow, { backgroundColor: colors.panel, borderColor: tier.unlocked ? colors.accent : colors.border }]}><View style={[styles.tierNumber, { borderColor: tier.unlocked ? colors.accent : colors.border }]}><Text style={[styles.tierNumberText, { color: tier.unlocked ? colors.accent : colors.mutedForeground }]}>{tier.tier}</Text></View><View style={styles.tierCopy}><Text style={[styles.tierLabel, { color: colors.foreground }]}>{tier.is_premium ? 'PREMIUM' : 'GRATIS'} · {formatNumber(tier.xp_required)} XP</Text><Text style={[styles.tierReward, { color: colors.mutedForeground }]}>{rewardText(tier.reward)}</Text></View>{tier.claimed ? <Feather name="check-circle" size={18} color={colors.success} /> : canClaim ? <Pressable testID={`world-season-claim-${tier.tier}`} accessibilityRole="button" disabled={claiming === tier.tier} onPress={() => { void handleClaim(tier); }} style={[styles.claimButton, { backgroundColor: colors.accent }]}>{claiming === tier.tier ? <ActivityIndicator size="small" color={colors.ink} /> : <Text style={[styles.claimText, { color: colors.ink }]}>RECLAMAR</Text>}</Pressable> : <Feather name={tier.is_premium && !progress?.is_premium ? 'lock' : 'clock'} size={16} color={colors.mutedForeground} />}</View>;
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
      {snapshot && panel === 'rankings' ? <View style={styles.panelStack}><Text style={[styles.eyebrow, { color: colors.accent }]}>TEMPORADA S1_2026</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ranking del mundo</Text><Text style={[styles.copy, { color: colors.mutedForeground }]}>Clasificación pública con nombres resueltos por el RPC oficial.</Text>{rankings.length ? rankings.map((entry) => <View key={`${entry.season_key}-${entry.player_id}`} style={[styles.rankRow, { backgroundColor: colors.panel, borderColor: entry.player_id === myPlayerId ? colors.primary : colors.border }]}><Text style={[styles.rankNumber, { color: entry.rank_position <= 3 ? colors.accent : colors.mutedForeground }]}>#{entry.rank_position}</Text><View style={styles.rankCopy}><Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{entry.display_name ?? `Forjador #${entry.rank_position}`}{entry.player_id === myPlayerId ? ' · TÚ' : ''}</Text><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{entry.mmr} MMR · {entry.wins}V / {entry.losses}D / {entry.draws}E</Text></View><Text style={[styles.winRate, { color: colors.success }]}>{entry.wins + entry.losses + entry.draws ? Math.round((entry.wins / (entry.wins + entry.losses + entry.draws)) * 100) : 0}%</Text></View>) : <EmptyState icon="rankings" title="Ranking en espera" copy="Aún no hay registros para esta temporada." colors={colors} />}</View> : null}
    </View>
  </ScrollView></ScreenShell>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 17, gap: 13 }, header: { paddingHorizontal: 17, gap: 13 }, headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headerCopy: { flex: 1 }, headerSeal: { width: 43, height: 43, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, refreshButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.45 }, title: { fontSize: 27, fontWeight: '800', marginTop: 3 }, sectionTitle: { fontSize: 21, fontWeight: '800', marginTop: 4 }, copy: { fontSize: 12, lineHeight: 18 }, tabs: { gap: 8, paddingVertical: 3, paddingRight: 12 }, tab: { minHeight: 38, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, tabText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.45 }, tabOverlay: { position: 'absolute', top: 110, left: 17, right: 17, height: 39, flexDirection: 'row', gap: 8, zIndex: -1 }, hiddenTabAction: { flex: 1 }, panelStack: { gap: 12 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, counter: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9 }, loading: { minHeight: 250, alignItems: 'center', justifyContent: 'center', gap: 14 }, error: { borderWidth: 1, borderRadius: 13, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'center' }, errorText: { flex: 1, fontSize: 12, lineHeight: 18 }, bossCard: { borderWidth: 1, borderRadius: 17, overflow: 'hidden' }, bossArt: { height: 148, position: 'relative', justifyContent: 'flex-end', padding: 14 }, bossArtCopy: { zIndex: 1, paddingRight: 76 }, bossCode: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, bossTitle: { fontSize: 20, fontWeight: '900', marginTop: 5 }, tierPill: { position: 'absolute', right: 13, top: 13, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 }, tierText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, bossBody: { padding: 14, gap: 10 }, bossLore: { fontSize: 12, lineHeight: 18 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, metaText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.45 }, hpRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, hpTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden' }, hpFill: { height: '100%', borderRadius: 4 }, hpText: { fontSize: 10, fontWeight: '800' }, rewardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, rewardText: { flex: 1, fontSize: 10, fontWeight: '800' }, damageText: { fontSize: 10, fontWeight: '800' }, primaryButton: { minHeight: 45, borderRadius: 11, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, primaryButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }, integrityNote: { fontSize: 9, lineHeight: 14, textAlign: 'center' }, raidCard: { position: 'relative', overflow: 'hidden', borderWidth: 1, borderRadius: 16, padding: 14, gap: 11 }, raidStripe: { position: 'absolute', left: 0, right: 0, top: 0, height: 3 }, raidHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, raidIcon: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, raidCopy: { flex: 1 }, raidTitle: { fontSize: 15, fontWeight: '800', lineHeight: 19 }, difficulty: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, raidStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' }, raidCode: { fontSize: 9, letterSpacing: 1 }, secondaryButton: { minHeight: 43, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, secondaryButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, loreCard: { borderWidth: 1, borderRadius: 15, padding: 13, gap: 10 }, loreHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, loreSeal: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, loreCopy: { flex: 1 }, loreCategory: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, loreTitle: { fontSize: 15, fontWeight: '800', marginTop: 3 }, lorePreview: { fontSize: 11, lineHeight: 17 }, loreContent: { fontSize: 12, lineHeight: 19 }, loreRelated: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, searchBox: { borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, fontSize: 12, paddingVertical: 9 }, seasonHero: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 9 }, seasonTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800' }, progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }, notice: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'center' }, noticeText: { flex: 1, fontSize: 11, lineHeight: 17 }, tierRow: { minHeight: 66, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, tierNumber: { width: 37, height: 37, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, tierNumberText: { fontSize: 14, fontWeight: '900' }, tierCopy: { flex: 1 }, tierLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }, tierReward: { fontSize: 11, marginTop: 4 }, claimButton: { minHeight: 31, borderRadius: 8, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' }, claimText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 }, rankRow: { minHeight: 64, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, rankNumber: { width: 34, fontSize: 15, fontWeight: '900' }, rankCopy: { flex: 1 }, rankName: { fontSize: 13, fontWeight: '800' }, winRate: { fontSize: 13, fontWeight: '900' }, empty: { borderWidth: 1, borderRadius: 15, padding: 26, alignItems: 'center', gap: 9 }, emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' }, emptyCopy: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
