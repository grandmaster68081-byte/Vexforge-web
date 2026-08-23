import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const cards = [
  { name: 'AURORA-9', faction: 'LUMEN', power: '82', color: 'primary' as const, icon: 'sunny-outline' as const },
  { name: 'GRAVEMIND', faction: 'UMBRA', power: '76', color: 'accent' as const, icon: 'moon-outline' as const },
  { name: 'IRON WARDEN', faction: 'FORGE', power: '68', color: 'success' as const, icon: 'shield-outline' as const },
  { name: 'NULL VECTOR', faction: 'VOID', power: '61', color: 'danger' as const, icon: 'aperture-outline' as const },
];

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>ARCHIVO // 127 CARTAS</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Tu colección</Text>
      <View style={styles.summary}><View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>24</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>DESBLOQUEADAS</Text></View><View><Text style={[styles.summaryNumber, { color: colors.accent }]}>4</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>FACCIONES</Text></View><View><Text style={[styles.summaryNumber, { color: colors.success }]}>18%</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>COMPLETADO</Text></View></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cartas destacadas</Text>
      <View style={styles.grid}>{cards.map((card) => { const accent = colors[card.color]; return <View key={card.name} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.cardArt, { backgroundColor: colors.panelStrong, borderColor: accent }]}><Ionicons name={card.icon} size={35} color={accent} /><Text style={[styles.power, { color: accent }]}>{card.power}</Text></View><Text style={[styles.cardName, { color: colors.foreground }]}>{card.name}</Text><Text style={[styles.faction, { color: colors.mutedForeground }]}>{card.faction}</Text></View>; })}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 26, padding: 17, borderRadius: 17 },
  summaryNumber: { fontSize: 23, fontWeight: '700' },
  summaryLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 30, marginBottom: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  card: { width: '48%', borderWidth: 1, borderRadius: 17, padding: 10, marginBottom: 2 },
  cardArt: { height: 128, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  power: { position: 'absolute', bottom: 8, right: 9, fontSize: 15, fontWeight: '800' },
  cardName: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 11 },
  faction: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 3 },
});