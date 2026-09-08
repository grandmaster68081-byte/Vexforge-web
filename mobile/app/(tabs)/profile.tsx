import { useCallback, useEffect, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import {
  loadPlayerAchievements,
  loadPlayerRank,
  loadSocialSnapshot,
  type MobileSocialSnapshot,
  type PlayerAchievement,
  type PlayerRank,
} from '@/lib/supabase';
import { CANONICAL_BACKGROUNDS, OFFICIAL_ASSETS } from '@/constants/visual';
import { typography } from '@/constants/typography';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { MOTION } from '@/constants/experience';

type Colors = ReturnType<typeof useColors>;
type ProfileSection = 'stats' | 'achievements' | 'titles' | 'history' | 'ranking';
type IconName = keyof typeof Ionicons.glyphMap;

const TOP_NAV: Array<{ label: string; icon: IconName; section?: ProfileSection; on: 'collection' | 'fusion' | 'achievements' | 'profile' }> = [
  { label: 'COLECCIÓN', icon: 'collection', on: 'collection' },
  { label: 'TUS CARTAS', icon: 'cards', on: 'collection' },
  { label: 'FUSIÓN', icon: 'fusion', on: 'fusion' },
  { label: 'LOGROS', icon: 'achievements', section: 'achievements', on: 'achievements' },
  { label: 'PERFIL', icon: 'profile', section: 'stats', on: 'profile' },
];

const PROFILE_SECTIONS: Array<{ id: ProfileSection; label: string; icon: IconName }> = [
  { id: 'stats', label: 'ESTADÍSTICAS', icon: 'progress' },
  { id: 'achievements', label: 'LOGROS', icon: 'trophy-outline' },
  { id: 'titles', label: 'TÍTULOS', icon: 'crown' },
  { id: 'history', label: 'HISTORIAL', icon: 'time-outline' },
  { id: 'ranking', label: 'RANKING', icon: 'star' },
];

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'VF';
}

function formatMemberSince(iso: string | null | undefined) {
  if (!iso) return 'FECHA NO DISPONIBLE';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'FECHA NO DISPONIBLE'
    : `DESDE ${date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return 'Fecha no disponible';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

function rankDetails(mmr: number) {
  if (mmr >= 3000) return { label: 'MYTHIC', icon: 'diamond' as IconName, tone: 'rarityLegendary' as const };
  if (mmr >= 2400) return { label: 'DIAMOND', icon: 'diamond-outline' as IconName, tone: 'rarityRare' as const };
  if (mmr >= 1800) return { label: 'PLATINUM', icon: 'medal-outline' as IconName, tone: 'rarityEpic' as const };
  if (mmr >= 1300) return { label: 'GOLD', icon: 'trophy-outline' as IconName, tone: 'accent' as const };
  if (mmr >= 900) return { label: 'SILVER', icon: 'shield-outline' as IconName, tone: 'rarityRare' as const };
  if (mmr >= 500) return { label: 'BRONZE', icon: 'shield-half-outline' as IconName, tone: 'primary' as const };
  return { label: 'SIN RANGO', icon: 'ellipse-outline' as IconName, tone: 'mutedForeground' as const };
}

function getWinStreak(matches: MobileSocialSnapshot['matches'], playerId: string) {
  let streak = 0;
  for (const match of matches) {
    if (match.status !== 'resolved') continue;
    if (match.winner === playerId) streak += 1;
    else break;
  }
  return streak;
}

function ActionLink({
  label,
  icon,
  onPress,
  colors,
  testID,
  compact = false,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  colors: Colors;
  testID: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionLink,
        compact && styles.actionLinkCompact,
        { borderColor: `${colors.accent}99`, opacity: pressed ? 0.68 : 1 },
      ]}
    >
      <Ionicons name={icon} size={compact ? 13 : 15} color={colors.accent} />
      <Text style={[styles.actionLinkText, { color: colors.accent }]}>{label}</Text>
      <Ionicons name="chevron-right" size={14} color={colors.accent} />
    </Pressable>
  );
}

function TopNav({
  active,
  colors,
  onNavigate,
}: {
  active: ProfileSection;
  colors: Colors;
  onNavigate: (item: (typeof TOP_NAV)[number]) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNav}>
      {TOP_NAV.map((item) => {
        const selected = item.section === active || (item.on === 'profile' && active === 'stats');
        return (
          <Pressable
            key={item.label}
            testID={`profile-top-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            onPress={() => onNavigate(item)}
            style={({ pressed }) => [
              styles.topNavItem,
              { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? `${colors.accent}16` : `${colors.ink}B8`, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Ionicons name={item.icon} size={18} color={selected ? colors.accent : colors.rarityRare} />
            <Text style={[styles.topNavText, { color: selected ? colors.accent : colors.foreground }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ProfileIdentity({
  colors,
  displayName,
  email,
  createdAt,
  online,
  rankLabel,
  onEdit,
}: {
  colors: Colors;
  displayName: string;
  email: string;
  createdAt: string | null;
  online: boolean;
  rankLabel: string;
  onEdit: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(70).duration(MOTION.reveal)} style={[styles.identityCard, { borderColor: `${colors.accent}AA` }]}>
      <Image source={{ uri: CANONICAL_BACKGROUNDS.profile }} style={StyleSheet.absoluteFillObject} resizeMode="cover" accessibilityLabel="Arte oficial del perfil VEXFORGE" />
      <LinearGradient colors={[`${colors.ink}D8`, `${colors.ink}7A`, `${colors.ink}E8`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.identityAvatar, { borderColor: colors.accent, backgroundColor: `${colors.ink}D9` }]}>
        <Ionicons name="profile" size={39} color={colors.accent} />
        <View style={[styles.avatarRing, { borderColor: `${colors.accent}66` }]} />
      </View>
      <View style={styles.identityCopy}>
        <Text style={[styles.identityName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
        <Text style={[styles.identityHandle, { color: colors.mutedForeground }]} numberOfLines={1}>@{displayName.toLowerCase().replace(/\s+/g, '_')}</Text>
        <View style={styles.identityMeta}>
          <View style={[styles.onlineDot, { backgroundColor: online ? colors.success : colors.danger }]} />
          <Text style={[styles.identityStatus, { color: online ? colors.success : colors.mutedForeground }]}>{online ? 'En línea' : 'Sin conexión'}</Text>
          <View style={[styles.rankPill, { borderColor: colors.border }]}>
            <Ionicons name="shield-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.rankPillText, { color: colors.mutedForeground }]}>{rankLabel}</Text>
          </View>
        </View>
        <Text style={[styles.identityEmail, { color: `${colors.foreground}99` }]} numberOfLines={1}>{email}</Text>
      </View>
      <ActionLink label="EDITAR PERFIL" icon="edit" onPress={onEdit} colors={colors} testID="profile-edit" compact />
      <Text style={[styles.memberSince, { color: `${colors.foreground}99` }]}>{formatMemberSince(createdAt)}</Text>
    </Animated.View>
  );
}

function SeasonCard({ colors, level, xp, xpToNext, onDetails }: { colors: Colors; level: number | string; xp: number; xpToNext: number; onDetails: () => void }) {
  const percent = Math.min(100, Math.max(0, Math.round((xp / Math.max(1, xpToNext)) * 100)));
  return (
    <Animated.View entering={FadeInDown.delay(145).duration(MOTION.reveal)} style={[styles.seasonCard, { borderColor: `${colors.rarityEpic}99` }]}>
      <Image source={{ uri: CANONICAL_BACKGROUNDS.profile }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient colors={[`${colors.ink}DA`, `${colors.rarityEpic}44`, `${colors.ink}F2`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.seasonSeal, { borderColor: colors.rarityEpic, backgroundColor: `${colors.ink}CC` }]}>
        <Ionicons name="crown" size={27} color={colors.rarityEpic} />
      </View>
      <View style={styles.seasonCopy}>
        <Text style={[styles.eyebrow, { color: colors.rarityEpic }]}>TEMPORADA ACTUAL</Text>
        <Text style={[styles.seasonTitle, { color: colors.foreground }]}>Tu camino en Vexforge</Text>
        <Text style={[styles.seasonSubtitle, { color: colors.mutedForeground }]}>Compite, evoluciona, deja tu huella.</Text>
      </View>
      <ActionLink label="VER DETALLES" icon="eye" onPress={onDetails} colors={colors} testID="profile-season-details" compact />
      <View style={styles.seasonProgress}>
        <Text style={[styles.levelText, { color: colors.foreground }]}>Nv. {level}</Text>
        <View style={[styles.progressTrack, { backgroundColor: `${colors.mutedForeground}44` }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${percent}%` }]} />
        </View>
        <Text style={[styles.progressTarget, { color: colors.mutedForeground }]}>{xp.toLocaleString('es-ES')} / {xpToNext.toLocaleString('es-ES')} XP</Text>
      </View>
    </Animated.View>
  );
}

function StatCell({ icon, label, value, colors }: { icon: IconName; label: string; value: string | number; colors: Colors }) {
  return (
    <View style={styles.statCell}>
      <Ionicons name={icon} size={19} color={colors.accent} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function AchievementRow({ achievement, colors }: { achievement: PlayerAchievement; colors: Colors }) {
  return (
    <View testID={`profile-achievement-${achievement.id}`} style={[styles.achievementRow, { backgroundColor: `${colors.panel}E8`, borderColor: colors.border }]}>
      <View style={[styles.achievementIcon, { borderColor: `${colors.accent}99`, backgroundColor: `${colors.accent}15` }]}>
        <Ionicons name="trophy-outline" size={19} color={colors.accent} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>{achievement.title}</Text>
        <Text style={[styles.rowBody, { color: colors.mutedForeground }]} numberOfLines={2}>{achievement.description}</Text>
        <Text style={[styles.rowMeta, { color: colors.accent }]}>{achievement.points} PTS · {formatDate(achievement.unlocked_at)}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
    </View>
  );
}

function HistoryRow({ match, playerId, colors }: { match: MobileSocialSnapshot['matches'][number]; playerId: string; colors: Colors }) {
  const won = match.status === 'resolved' && match.winner === playerId;
  const draw = match.status === 'resolved' && !match.winner;
  const tone = match.status !== 'resolved' ? colors.accent : won ? colors.success : draw ? colors.mutedForeground : colors.danger;
  const elo = match.player_a === playerId ? match.elo_change_a : match.elo_change_b;
  return (
    <View style={[styles.historyRow, { borderColor: `${tone}77`, backgroundColor: `${colors.panel}E8` }]}>
      <View style={[styles.historyIcon, { borderColor: tone, backgroundColor: `${tone}18` }]}>
        <Ionicons name={match.status !== 'resolved' ? 'time-outline' : won ? 'checkmark-circle' : 'close-circle-outline'} size={17} color={tone} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{match.status !== 'resolved' ? 'Combate pendiente' : won ? 'Victoria' : draw ? 'Empate' : 'Derrota'}</Text>
        <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>contra {match.opponent_name ?? 'Forjador rival'} · {formatDate(match.created_at)}</Text>
      </View>
      <Text style={[styles.eloValue, { color: tone }]}>{elo == null ? '—' : `${elo > 0 ? '+' : ''}${elo}`}</Text>
    </View>
  );
}

function RankingRow({ entry, isMe, colors }: { entry: MobileSocialSnapshot['rankings'][number]; isMe: boolean; colors: Colors }) {
  return (
    <View style={[styles.rankingRow, { borderColor: isMe ? colors.accent : colors.border, backgroundColor: isMe ? `${colors.accent}12` : `${colors.panel}E8` }]}>
      <Text style={[styles.rankPosition, { color: isMe ? colors.accent : colors.mutedForeground }]}>#{entry.rank_position}</Text>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>{entry.display_name ?? 'Forjador'}{isMe ? ' · TÚ' : ''}</Text>
        <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{entry.mmr} ELO · {entry.wins}V / {entry.losses}D</Text>
      </View>
      <Ionicons name="shield-outline" size={17} color={isMe ? colors.accent : colors.rarityRare} />
    </View>
  );
}

function EmptyPanel({ icon, title, body, colors }: { icon: IconName; title: string; body: string; colors: Colors }) {
  return (
    <View style={[styles.emptyPanel, { backgroundColor: `${colors.panel}E8`, borderColor: colors.border }]}>
      <Ionicons name={icon} size={28} color={colors.accent} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text>
    </View>
  );
}

function ContentPanel({
  section,
  colors,
  stats,
  achievements,
  social,
  playerId,
  progress,
  wallet,
  onNavigate,
}: {
  section: ProfileSection;
  colors: Colors;
  stats: ReturnType<typeof useGame>['stats'];
  achievements: PlayerAchievement[];
  social: MobileSocialSnapshot | null;
  playerId: string;
  progress: ReturnType<typeof useGame>['progress'];
  wallet: ReturnType<typeof useGame>['wallet'];
  onNavigate: (target: 'collection' | 'deck' | 'missions' | 'social' | 'meta') => void;
}) {
  if (section === 'achievements') {
    return achievements.length ? <View style={styles.contentStack}>{achievements.map((achievement) => <AchievementRow key={achievement.id} achievement={achievement} colors={colors} />)}</View> : <EmptyPanel icon="trophy-outline" title="Aún no hay logros" body="Completa misiones y combates para registrar tus primeros hitos." colors={colors} />;
  }
  if (section === 'titles') {
    return achievements.length ? (
      <View style={styles.contentStack}>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Tus títulos se desbloquean a partir de los logros registrados por el servidor.</Text>
        {achievements.map((achievement) => (
          <Pressable key={achievement.id} testID={`profile-title-${achievement.id}`} accessibilityRole="button" accessibilityLabel={`Ver título ${achievement.title}`} onPress={() => onNavigate('meta')} style={[styles.titleRow, { backgroundColor: `${colors.panel}E8`, borderColor: colors.rarityEpic }]}>
            <Ionicons name="crown" size={20} color={colors.rarityEpic} />
            <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{achievement.title}</Text><Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{achievement.description}</Text></View>
            <Ionicons name="chevron-right" size={16} color={colors.rarityEpic} />
          </Pressable>
        ))}
      </View>
    ) : <EmptyPanel icon="crown" title="Sin títulos desbloqueados" body="Tus próximos logros aparecerán aquí como títulos de forjador." colors={colors} />;
  }
  if (section === 'history') {
    return social?.matches.length ? <View style={styles.contentStack}>{social.matches.map((match) => <HistoryRow key={match.id} match={match} playerId={playerId} colors={colors} />)}</View> : <EmptyPanel icon="time-outline" title="Sin combates registrados" body="Tus partidas aparecerán aquí después de una resolución oficial." colors={colors} />;
  }
  if (section === 'ranking') {
    return social?.rankings.length ? <View style={styles.contentStack}>{social.rankings.map((entry) => <RankingRow key={entry.player_id} entry={entry} isMe={entry.player_id === playerId} colors={colors} />)}</View> : <EmptyPanel icon="star" title="Ranking en espera" body="Aún no hay registros de temporada publicados para mostrar." colors={colors} />;
  }
  return (
    <View style={styles.contentStack}>
      <View style={styles.statGrid}>
        <StatCell icon="trophy-outline" label="VICTORIAS" value={stats?.pvp_wins ?? 0} colors={colors} />
        <StatCell icon="close-circle-outline" label="DERROTAS" value={stats?.pvp_losses ?? 0} colors={colors} />
        <StatCell icon="flame" label="RACHA" value={getWinStreak(social?.matches ?? [], playerId) || '—'} colors={colors} />
        <StatCell icon="shield-outline" label="ELO" value={social?.rankings.find((entry) => entry.player_id === playerId)?.mmr ?? '—'} colors={colors} />
      </View>
      <View style={styles.shortcutGrid}>
        <ShortcutCard icon="deck" label="MIS MAZOS" body="Gestiona tus mazos de batalla" onPress={() => onNavigate('deck')} colors={colors} testID="profile-decks" />
        <ShortcutCard icon="cards" label="CARTAS OBTENIDAS" body="Explora tu colección" onPress={() => onNavigate('collection')} colors={colors} testID="profile-cards" />
      </View>
      <View style={[styles.resourceStrip, { borderColor: colors.border, backgroundColor: `${colors.panel}E8` }]}>
        <Ionicons name="flash-outline" size={17} color={colors.rarityRare} />
        <View style={styles.rowCopy}><Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>ENERGÍA</Text><Text style={[styles.resourceValue, { color: colors.foreground }]}>{progress?.energy ?? '—'} / {progress?.max_energy ?? '—'}</Text></View>
        <Ionicons name="coin" size={17} color={colors.accent} />
        <View style={styles.rowCopy}><Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>VEX DISPONIBLE</Text><Text style={[styles.resourceValue, { color: colors.foreground }]}>{(wallet?.vex_ingame ?? 0).toLocaleString('es-ES')}</Text></View>
      </View>
    </View>
  );
}

function ShortcutCard({ icon, label, body, onPress, colors, testID }: { icon: IconName; label: string; body: string; onPress: () => void; colors: Colors; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.shortcutCard, { borderColor: `${colors.accent}88`, backgroundColor: `${colors.panel}E8`, opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.shortcutIcon, { borderColor: colors.accent, backgroundColor: `${colors.accent}12` }]}><Ionicons name={icon} size={20} color={colors.accent} /></View>
      <Text style={[styles.shortcutLabel, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.shortcutBody, { color: colors.mutedForeground }]} numberOfLines={2}>{body}</Text>
      <Ionicons name="chevron-right" size={15} color={colors.accent} />
    </Pressable>
  );
}

function BottomNav({ colors, onNavigate }: { colors: Colors; onNavigate: (target: 'home' | 'battle' | 'collection' | 'deck' | 'profile') => void }) {
  const items: Array<{ label: string; icon: IconName; target: 'home' | 'battle' | 'collection' | 'deck' | 'profile' }> = [
    { label: 'Inicio', icon: 'home', target: 'home' },
    { label: 'Batalla', icon: 'arena', target: 'battle' },
    { label: 'Cartas', icon: 'cards', target: 'collection' },
    { label: 'Mazo', icon: 'deck', target: 'deck' },
    { label: 'Perfil', icon: 'profile', target: 'profile' },
  ];
  return (
    <View style={[styles.bottomNav, { borderTopColor: colors.border, backgroundColor: `${colors.ink}F5` }]}>
      {items.map((item) => {
        const active = item.target === 'profile';
        return (
          <Pressable key={item.target} testID={`profile-bottom-${item.target}`} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={item.label} onPress={() => onNavigate(item.target)} style={({ pressed }) => [styles.bottomNavItem, { opacity: pressed ? 0.62 : 1 }]}>
            <Ionicons name={item.icon} size={21} color={active ? colors.accent : colors.mutedForeground} />
            <Text style={[styles.bottomNavText, { color: active ? colors.accent : colors.mutedForeground }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AuthPrompt({ colors, insets }: { colors: Colors; insets: { top: number; bottom: number } }) {
  const { authError, authLoading, signIn, signUp } = useGame();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  return (
    <ScreenShell surface="profile">
      <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.authContent, { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.authMark, { backgroundColor: colors.panel, borderColor: colors.border }]}><Ionicons name="profile" size={28} color={colors.accent} /></View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>IDENTIDAD DEL NEXUS</Text>
        <Text style={[styles.authTitle, { color: colors.foreground }]}>Tu perfil espera.</Text>
        <Text style={[styles.authBody, { color: colors.mutedForeground }]}>Inicia sesión para consultar tu progreso, rango y recompensas.</Text>
        <TextInputField label="CORREO" value={email} onChangeText={setEmail} placeholder="forjador@ejemplo.com" colors={colors} keyboardType="email-address" />
        <TextInputField label="CONTRASEÑA" value={password} onChangeText={setPassword} placeholder="••••••••" colors={colors} secureTextEntry />
        {authError ? <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.danger }]}>{authError}</Text> : null}
        <Pressable accessibilityRole="button" disabled={authLoading || !email || !password} onPress={() => { void (mode === 'signin' ? signIn(email, password) : signUp(email, password)); }} style={[styles.primaryButton, { backgroundColor: colors.accent, opacity: authLoading || !email || !password ? 0.45 : 1 }]}>
          {authLoading ? <ActivityIndicator color={colors.ink} /> : <Text style={[styles.primaryButtonText, { color: colors.ink }]}>{mode === 'signin' ? 'ENTRAR AL NEXUS' : 'CREAR CUENTA'}</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={styles.modeButton}><Text style={[styles.modeText, { color: colors.mutedForeground }]}>{mode === 'signin' ? '¿Nuevo en VEXFORGE? Crear cuenta' : 'Ya tengo cuenta · Iniciar sesión'}</Text></Pressable>
      </KeyboardAwareScrollViewCompat>
    </ScreenShell>
  );
}

function TextInputField({ label, value, onChangeText, placeholder, colors, secureTextEntry = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: Colors; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize="none" style={[styles.input, { color: colors.foreground, backgroundColor: colors.panel, borderColor: colors.border }]} />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session, player, progress, stats, collection, syncState, syncError, authLoading, refresh, signOut } = useGame();
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [social, setSocial] = useState<MobileSocialSnapshot | null>(null);
  const [section, setSection] = useState<ProfileSection>('stats');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const compact = width < 370;

  const loadDetails = useCallback(async (isRefresh = false) => {
    if (!session || !player?.id) return;
    if (isRefresh) setRefreshing(true);
    else setDetailsLoading(true);
    setDetailsError(null);
    const results = await Promise.allSettled([
      loadPlayerRank(session, player.id),
      loadPlayerAchievements(session, player.id),
      loadSocialSnapshot(session, player.id),
    ]);
    const [rankResult, achievementsResult, socialResult] = results;
    if (rankResult.status === 'fulfilled') setRank(rankResult.value);
    if (achievementsResult.status === 'fulfilled') setAchievements(achievementsResult.value);
    if (socialResult.status === 'fulfilled') setSocial(socialResult.value);
    const firstError = results.find((result) => result.status === 'rejected');
    if (firstError?.status === 'rejected') setDetailsError(firstError.reason instanceof Error ? firstError.reason.message : 'No se pudo sincronizar el detalle del perfil.');
    setDetailsLoading(false);
    setRefreshing(false);
  }, [player?.id, session]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  const displayName = player?.display_name?.trim() || 'FORJADOR';
  const email = player?.email ?? session?.user.email ?? 'Cuenta VEXFORGE';
  const rankInfo = rankDetails(Number(rank?.mmr ?? 0));
  const rankColor = colors[rankInfo.tone];
  const xp = Number(progress?.xp ?? 0);
  const xpToNext = Number(progress?.xp_to_next ?? 0);

  const navigate = (target: 'collection' | 'deck' | 'missions' | 'social' | 'meta') => {
    if (target === 'collection') router.push('/collection');
    if (target === 'deck') router.push('/deck');
    if (target === 'missions') router.push('/missions');
    if (target === 'social') router.push('/social');
    if (target === 'meta') router.push('/meta');
  };
  const navigateBottom = (target: 'home' | 'battle' | 'collection' | 'deck' | 'profile') => {
    if (target === 'home') router.push('/');
    if (target === 'battle') router.push('/battle');
    if (target === 'collection') router.push('/collection');
    if (target === 'deck') router.push('/deck');
  };
  const navigateTop = (item: (typeof TOP_NAV)[number]) => {
    if (item.on === 'collection') navigate('collection');
    if (item.on === 'fusion') router.push('/store?mode=fusion');
    if (item.on === 'achievements') setSection('achievements');
    if (item.on === 'profile') setSection('stats');
  };

  if (authLoading && !session) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /></View>;
  if (!session) return <AuthPrompt colors={colors} insets={insets} />;
  if (!player) return <ScreenShell surface="profile"><View style={[styles.center, { paddingTop: insets.top }]}><ActivityIndicator color={colors.accent} /><Text style={[styles.authBody, { color: colors.mutedForeground }]}>Cargando identidad del Nexus…</Text></View></ScreenShell>;

  return (
    <ScreenShell surface="profile">
      <View style={styles.screen}>
        <ScrollView
          testID="profile-screen"
          contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 96 }}
          refreshControl={<RefreshControl refreshing={refreshing || syncState === 'loading'} onRefresh={() => { void Promise.all([refresh(), loadDetails(true)]); }} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={{ uri: OFFICIAL_ASSETS.logo }} style={styles.logo} resizeMode="contain" accessibilityLabel="VEXFORGE · Forja tu leyenda" />
            <View style={styles.headerActions}>
              <Pressable testID="profile-settings" accessibilityRole="button" accessibilityLabel="Abrir sistemas" onPress={() => navigate('meta')} style={[styles.headerIcon, { borderColor: colors.border }]}><Ionicons name="gear" size={19} color={colors.accent} /></Pressable>
              <Pressable testID="profile-notifications" accessibilityRole="button" accessibilityLabel="Abrir misiones y recompensas" onPress={() => navigate('missions')} style={[styles.headerIcon, { borderColor: colors.border }]}><Ionicons name="notifications-outline" size={19} color={colors.accent} /></Pressable>
              <Pressable testID="profile-sign-out" accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={() => { void signOut(); }} style={[styles.headerIcon, { borderColor: colors.border }]}><Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} /></Pressable>
            </View>
          </View>
          <TopNav active={section} colors={colors} onNavigate={navigateTop} />
          <ProfileIdentity colors={colors} displayName={displayName} email={email} createdAt={player.created_at} online={syncState === 'connected'} rankLabel={rank?.tier?.toUpperCase() ?? rankInfo.label} onEdit={() => navigate('meta')} />
          {syncError || detailsError ? <View accessibilityRole="alert" style={[styles.message, { borderColor: `${colors.danger}77`, backgroundColor: `${colors.danger}14` }]}><Ionicons name="warning-outline" size={17} color={colors.danger} /><Text style={[styles.messageText, { color: colors.foreground }]}>{detailsError ?? syncError}</Text></View> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileSections}>
            {PROFILE_SECTIONS.map((item) => {
              const active = item.id === section;
              return <Pressable key={item.id} testID={`profile-section-${item.id}`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setSection(item.id)} style={({ pressed }) => [styles.profileSection, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? `${colors.accent}16` : `${colors.ink}C8`, opacity: pressed ? 0.72 : 1 }]}><Ionicons name={item.icon} size={18} color={active ? colors.accent : colors.rarityRare} /><Text style={[styles.profileSectionText, { color: active ? colors.accent : colors.foreground }]}>{compact && item.id === 'achievements' ? 'LOGROS' : item.label}</Text></Pressable>;
            })}
          </ScrollView>
          {detailsLoading && !rank ? <View style={[styles.loadingBlock, { borderColor: colors.border, backgroundColor: `${colors.panel}E8` }]}><ActivityIndicator size="small" color={colors.accent} /><Text style={[styles.rowBody, { color: colors.mutedForeground }]}>Sincronizando tu perfil…</Text></View> : null}
          <SeasonCard colors={colors} level={progress?.level ?? '—'} xp={xp} xpToNext={xpToNext} onDetails={() => setSection('ranking')} />
          <View style={styles.sectionHeading}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>REGISTRO DEL FORJADOR</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{PROFILE_SECTIONS.find((item) => item.id === section)?.label ?? 'ESTADÍSTICAS'}</Text></View><Text style={[styles.sectionCounter, { color: colors.mutedForeground }]}>{section === 'achievements' ? achievements.length : section === 'ranking' ? social?.rankings.length ?? 0 : section === 'history' ? social?.matches.length ?? 0 : collection.length}</Text></View>
          <ContentPanel section={section} colors={colors} stats={stats} achievements={achievements} social={social} playerId={player.id} progress={progress} wallet={wallet} onNavigate={navigate} />
          <View style={styles.quickLinks}>
            <ActionLink label="LOGROS" icon="trophy-outline" onPress={() => setSection('achievements')} colors={colors} testID="profile-quick-achievements" />
            <ActionLink label="TÍTULOS" icon="crown" onPress={() => setSection('titles')} colors={colors} testID="profile-quick-titles" />
            <ActionLink label="RECOMPENSAS" icon="gift" onPress={() => navigate('missions')} colors={colors} testID="profile-quick-rewards" />
            <ActionLink label="RED DE FORJADORES" icon="people-outline" onPress={() => navigate('social')} colors={colors} testID="profile-quick-social" />
          </View>
        </ScrollView>
        <BottomNav colors={colors} onNavigate={navigateBottom} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, minHeight: 58 },
  logo: { width: 185, height: 49 },
  headerActions: { flexDirection: 'row', gap: 7 },
  headerIcon: { width: 35, height: 35, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topNav: { gap: 7, paddingHorizontal: 17, paddingVertical: 8 },
  topNavItem: { minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  topNavText: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.55 },
  identityAvatar: { width: 70, height: 70, borderWidth: 1, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { position: 'absolute', width: 62, height: 62, borderWidth: 1, borderRadius: 31 },
  identityCopy: { flex: 1, minWidth: 0 },
  identityName: { fontFamily: typography.display, fontSize: 17 },
  identityHandle: { fontFamily: typography.body, fontSize: 11, marginTop: 1 },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  identityStatus: { fontFamily: typography.bodySemiBold, fontSize: 11 },
  rankPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, marginLeft: 4 },
  rankPillText: { fontFamily: typography.bodySemiBold, fontSize: 9 },
  identityEmail: { fontFamily: typography.body, fontSize: 9, marginTop: 5 },
  memberSince: { position: 'absolute', right: 14, bottom: 8, fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.6 },
  actionLink: { minHeight: 36, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionLinkCompact: { minHeight: 32, paddingHorizontal: 8 },
  actionLinkText: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 0.55 },
  identityCard: { minHeight: 132, marginHorizontal: 17, marginTop: 8, borderWidth: 1, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 11 },
  profileSections: { gap: 7, paddingHorizontal: 17, paddingTop: 13, paddingBottom: 2 },
  profileSection: { minHeight: 65, width: 78, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 6 },
  profileSectionText: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.35, textAlign: 'center' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 17, marginTop: 10, padding: 10, borderWidth: 1, borderRadius: 11 },
  messageText: { flex: 1, fontFamily: typography.body, fontSize: 11, lineHeight: 16 },
  loadingBlock: { marginHorizontal: 17, marginTop: 12, padding: 12, borderWidth: 1, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  seasonCard: { minHeight: 180, marginHorizontal: 17, marginTop: 14, borderWidth: 1, borderRadius: 18, overflow: 'hidden', padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  seasonSeal: { width: 55, height: 55, borderWidth: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  seasonCopy: { flex: 1 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.1 },
  seasonTitle: { fontFamily: typography.display, fontSize: 17, marginTop: 4 },
  seasonSubtitle: { fontFamily: typography.body, fontSize: 11, marginTop: 3 },
  seasonProgress: { position: 'absolute', left: 15, right: 15, bottom: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelText: { fontFamily: typography.bodyBold, fontSize: 10, width: 32 },
  progressTrack: { flex: 1, height: 7, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressTarget: { fontFamily: typography.bodySemiBold, fontSize: 9, width: 68, textAlign: 'right' },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: 17, marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontFamily: typography.display, fontSize: 19, marginTop: 3 },
  sectionCounter: { fontFamily: typography.bodyBold, fontSize: 10, letterSpacing: 0.7 },
  contentStack: { marginHorizontal: 17, gap: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' },
  statCell: { width: '25%', alignItems: 'center', paddingVertical: 11, minWidth: 66 },
  statValue: { fontFamily: typography.display, fontSize: 17, marginTop: 4 },
  statLabel: { fontFamily: typography.bodyBold, fontSize: 7, letterSpacing: 0.55, marginTop: 3, textAlign: 'center' },
  shortcutGrid: { flexDirection: 'row', gap: 8, marginTop: 9 },
  shortcutCard: { flex: 1, minHeight: 119, borderWidth: 1, borderRadius: 14, padding: 10, gap: 5 },
  shortcutIcon: { width: 31, height: 31, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { fontFamily: typography.display, fontSize: 11 },
  shortcutBody: { flex: 1, fontFamily: typography.body, fontSize: 10, lineHeight: 14 },
  resourceStrip: { minHeight: 56, marginTop: 9, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  resourceLabel: { fontFamily: typography.bodyBold, fontSize: 8, letterSpacing: 0.6 },
  resourceValue: { fontFamily: typography.bodySemiBold, fontSize: 12, marginTop: 1 },
  achievementRow: { minHeight: 72, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  achievementIcon: { width: 40, height: 40, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: typography.bodyBold, fontSize: 13 },
  rowBody: { fontFamily: typography.body, fontSize: 11, lineHeight: 15, marginTop: 2 },
  rowMeta: { fontFamily: typography.bodySemiBold, fontSize: 9, marginTop: 3 },
  titleRow: { minHeight: 64, borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHint: { fontFamily: typography.body, fontSize: 11, lineHeight: 16, marginBottom: 2 },
  historyRow: { minHeight: 64, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIcon: { width: 36, height: 36, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eloValue: { fontFamily: typography.bodyBold, fontSize: 12 },
  rankingRow: { minHeight: 61, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankPosition: { fontFamily: typography.display, fontSize: 15, width: 36 },
  emptyPanel: { minHeight: 150, marginHorizontal: 17, borderWidth: 1, borderRadius: 15, padding: 25, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: typography.display, fontSize: 16, marginTop: 9, textAlign: 'center' },
  emptyBody: { fontFamily: typography.body, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  quickLinks: { marginHorizontal: 17, marginTop: 18, gap: 8 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 70, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 4 },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomNavText: { fontFamily: typography.bodySemiBold, fontSize: 10 },
  authContent: { alignItems: 'stretch', paddingHorizontal: 24 },
  authMark: { alignSelf: 'center', width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 18, marginBottom: 22 },
  authTitle: { fontFamily: typography.display, fontSize: 27, marginTop: 7 },
  authBody: { fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 7 },
  inputGroup: { gap: 7, marginTop: 16 },
  inputLabel: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: typography.body, fontSize: 14 },
  errorText: { fontFamily: typography.body, fontSize: 12, lineHeight: 18, marginTop: 14 },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 20 },
  primaryButtonText: { fontFamily: typography.bodyBold, fontSize: 12, letterSpacing: 0.8 },
  modeButton: { alignItems: 'center', paddingVertical: 17 },
  modeText: { fontFamily: typography.bodySemiBold, fontSize: 12 },
});