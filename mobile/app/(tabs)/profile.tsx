import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { wins, vex, shards } = useGame();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>IDENTIDAD // FORJADOR</Text>
      <View style={styles.profileHeader}><View style={[styles.profileIcon, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><Ionicons name="person" size={34} color={colors.accent} /></View><View><Text style={[styles.title, { color: colors.foreground }]}>FORJADOR 001</Text><Text style={[styles.sub, { color: colors.mutedForeground }]}>NIVEL 07 · NEXUS ONLINE</Text></View></View>
      <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.levelRow}><Text style={[styles.label, { color: colors.mutedForeground }]}>RANGO DE FORJA</Text><Text style={[styles.level, { color: colors.accent }]}>07</Text></View><View style={[styles.track, { backgroundColor: colors.muted }]}><View style={[styles.fill, { backgroundColor: colors.accent, width: '68%' }]} /></View><Text style={[styles.xp, { color: colors.mutedForeground }]}>680 / 1.000 XP PARA NIVEL 08</Text></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Registro de actividad</Text>
      <View style={styles.stats}>{[['VICTORIAS', wins.toString(), 'trophy-outline'], ['VEX', vex.toLocaleString(), 'flash-outline'], ['FRAGMENTOS', shards.toString(), 'diamond-outline']].map(([label, value, icon]) => <View key={label} style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} /><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>)}</View>
      <View style={[styles.notice, { backgroundColor: colors.panelStrong, borderColor: colors.border }]}><Ionicons name="shield-checkmark-outline" size={21} color={colors.success} /><View style={styles.noticeCopy}><Text style={[styles.noticeTitle, { color: colors.foreground }]}>Cuenta protegida</Text><Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>Tu progreso local se guarda en este dispositivo.</Text></View></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 23 },
  profileIcon: { width: 70, height: 70, borderWidth: 1, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 5 },
  levelCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 26 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  level: { fontSize: 19, fontWeight: '800' },
  track: { height: 6, borderRadius: 4, overflow: 'hidden', marginTop: 14 },
  fill: { height: '100%', borderRadius: 4 },
  xp: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 30, marginBottom: 13 },
  stats: { flexDirection: 'row', gap: 9 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12 },
  statValue: { fontSize: 19, fontWeight: '800', marginTop: 17 },
  statLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.7, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 25 },
  noticeCopy: { flex: 1, marginLeft: 11 },
  noticeTitle: { fontSize: 13, fontWeight: '700' },
  noticeBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
});