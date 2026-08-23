import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ProgressBar } from '@/components/ProgressBar';

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { battleState, playerHealth, enemyHealth, turn, playTurn, resetBattle } = useGame();
  const finished = battleState !== 'ready';

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
      <View style={styles.topLine}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXUS // COMBATE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Umbral de ceniza</Text>
        </View>
        <View style={[styles.turnBadge, { borderColor: colors.border }]}><Text style={[styles.turnText, { color: colors.accent }]}>TURNO {turn}</Text></View>
      </View>

      <View style={[styles.arena, { backgroundColor: colors.ink, borderColor: colors.border }]}>
        <View style={styles.arenaHeader}><Text style={[styles.arenaCode, { color: colors.mutedForeground }]}>PROTOCOLO DE DUELO</Text><Ionicons name="radio-outline" size={16} color={colors.success} /></View>
        <View style={styles.combatant}>
          <View style={[styles.avatar, { backgroundColor: colors.panelStrong, borderColor: colors.primary }]}><Ionicons name="skull-outline" size={28} color={colors.primary} /></View>
          <View style={styles.healthInfo}><View style={styles.nameRow}><Text style={[styles.name, { color: colors.foreground }]}>CENIZA-07</Text><Text style={[styles.hp, { color: colors.primary }]}>{enemyHealth} HP</Text></View><ProgressBar value={enemyHealth} color={colors.danger} /></View>
        </View>
        <View style={styles.vs}><View style={[styles.vsLine, { backgroundColor: colors.border }]} /><Text style={[styles.vsText, { color: colors.mutedForeground }]}>VS</Text><View style={[styles.vsLine, { backgroundColor: colors.border }]} /></View>
        <View style={styles.combatant}>
          <View style={[styles.avatar, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}><Ionicons name="flash" size={28} color={colors.accent} /></View>
          <View style={styles.healthInfo}><View style={styles.nameRow}><Text style={[styles.name, { color: colors.foreground }]}>FORJADOR</Text><Text style={[styles.hp, { color: colors.success }]}>{playerHealth} HP</Text></View><ProgressBar value={playerHealth} color={colors.success} /></View>
        </View>
        <View style={[styles.log, { backgroundColor: colors.panel }]}><Ionicons name={finished ? (battleState === 'victory' ? 'trophy-outline' : 'close-circle-outline') : 'pulse-outline'} size={16} color={finished && battleState === 'victory' ? colors.accent : colors.primary} /><Text style={[styles.logText, { color: colors.mutedForeground }]}>{finished ? (battleState === 'victory' ? 'La arena reconoce tu dominio.' : 'El Nexus exige otra estrategia.') : 'Elige tu carta y rompe la defensa rival.'}</Text></View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mano de combate</Text>
      <View style={styles.hand}>
        {['NÚCLEO', 'VIGÍA', 'SOBRECARGA'].map((card, index) => (
          <View key={card} style={[styles.card, { backgroundColor: index === 2 ? colors.primary : colors.card, borderColor: index === 2 ? colors.primary : colors.border }]}>
            <Ionicons name={index === 0 ? 'shield-outline' : index === 1 ? 'eye-outline' : 'flash-outline'} size={22} color={index === 2 ? colors.primaryForeground : colors.primary} />
            <Text style={[styles.cardName, { color: index === 2 ? colors.primaryForeground : colors.foreground }]}>{card}</Text>
            <Text style={[styles.cardPower, { color: index === 2 ? colors.primaryForeground : colors.accent }]}>{index === 0 ? '18' : index === 1 ? '24' : '31'}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={finished ? resetBattle : playTurn} style={({ pressed }) => [styles.action, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}>
        <Ionicons name={finished ? 'refresh' : 'flash'} size={19} color={colors.primaryForeground} />
        <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{finished ? 'NUEVO DUELO' : 'EJECUTAR TURNO'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 23 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 7 },
  turnBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 8 },
  turnText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  arena: { borderWidth: 1, borderRadius: 22, padding: 17 },
  arenaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  arenaCode: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  combatant: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 54, height: 54, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  healthInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  name: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  hp: { fontSize: 11, fontWeight: '700' },
  vs: { flexDirection: 'row', alignItems: 'center', gap: 11, marginVertical: 18 },
  vsLine: { height: 1, flex: 1 },
  vsText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  log: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 11, marginTop: 23 },
  logText: { fontSize: 11, flex: 1, lineHeight: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 13 },
  hand: { flexDirection: 'row', gap: 9 },
  card: { flex: 1, minHeight: 113, borderWidth: 1, borderRadius: 15, padding: 12, justifyContent: 'space-between' },
  cardName: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  cardPower: { fontSize: 18, fontWeight: '800' },
  action: { height: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 21 },
  actionText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
});