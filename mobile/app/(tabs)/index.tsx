import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ForgeMark } from '@/components/ForgeMark';
import { ProgressBar } from '@/components/ProgressBar';

export default function ForgeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { wallet, stats, player, cardsTotal, featuredCards, syncState, refresh } = useGame();
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (claimed) return;
    refresh();
    setClaimed(true);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <ForgeMark />
          <View>
            <Text style={[styles.kicker, { color: colors.primary }]}>VEXFORGE</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>NEXUS // 01</Text>
          </View>
        </View>
        <Pressable style={[styles.iconButton, { borderColor: colors.border }]} accessibilityLabel="Notificaciones">
          <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
          <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} />
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>BUENAS, FORJADOR</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Tu siguiente victoria{'\n'}empieza aquí.</Text>
      </View>

      <View style={[styles.connectionCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={[styles.connectionDot, { backgroundColor: syncState === 'connected' ? colors.success : syncState === 'loading' ? colors.accent : colors.danger }]} />
        <View style={styles.connectionCopy}>
          <Text style={[styles.connectionTitle, { color: colors.foreground }]}>NEXUS {syncState === 'connected' ? 'CONECTADO' : syncState === 'loading' ? 'SINCRONIZANDO' : 'SIN CONEXIÓN'}</Text>
          <Text style={[styles.connectionBody, { color: colors.mutedForeground }]}>{cardsTotal > 0 ? `${cardsTotal} cartas oficiales disponibles` : 'Comprobando el catálogo oficial'}</Text>
        </View>
        <Ionicons name={syncState === 'connected' ? 'checkmark-circle-outline' : 'cloud-outline'} size={21} color={syncState === 'connected' ? colors.success : colors.mutedForeground} />
      </View>

      <View style={[styles.resourceCard, { backgroundColor: colors.panelStrong, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>BALANCE DE FORJA</Text>
          <Text style={[styles.balance, { color: colors.foreground }]}>{(wallet?.vex_ingame ?? 0).toLocaleString()}</Text>
          <Text style={[styles.resourceLabel, { color: colors.primary }]}>VEX DISPONIBLE</Text>
        </View>
        <View style={styles.resourceSide}>
          <View style={[styles.resourcePill, { backgroundColor: colors.panel }]}>
            <Ionicons name="diamond" size={14} color={colors.accent} />
            <Text style={[styles.pillText, { color: colors.foreground }]}>{(wallet?.reserved_ingame ?? 0)}</Text>
          </View>
          <Text style={[styles.resourceLabel, { color: colors.mutedForeground }]}>FRAGMENTOS</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Misión diaria</Text>
      <View style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.missionTop}>
          <View style={[styles.missionIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.success} />
          </View>
          <View style={styles.missionCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Prueba de acero</Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>Gana 1 batalla en el Nexus</Text>
          </View>
          <Text style={[styles.progressText, { color: colors.success }]}>{claimed ? '1/1' : '0/1'}</Text>
        </View>
        <ProgressBar value={claimed ? 100 : 42} color={colors.success} />
        <Pressable
          onPress={handleClaim}
          disabled={claimed}
          style={({ pressed }) => [styles.claimButton, { backgroundColor: claimed ? colors.muted : colors.primary, opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={[styles.claimText, { color: claimed ? colors.mutedForeground : colors.primaryForeground }]}>
            {claimed ? 'RECOMPENSA RECLAMADA' : 'RECLAMAR +75 VEX'}
          </Text>
          <Ionicons name={claimed ? 'checkmark' : 'arrow-forward'} size={17} color={claimed ? colors.mutedForeground : colors.primaryForeground} />
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nexus activo</Text>
        <Text style={[styles.counter, { color: colors.mutedForeground }]}>{(stats?.pvp_wins ?? 0)} VICTORIAS</Text>
      </View>
      <View style={[styles.nexusCard, { backgroundColor: colors.ink, borderColor: colors.border }]}>
        <View style={[styles.nexusGlow, { backgroundColor: colors.primary }]} />
        <View style={styles.nexusContent}>
          <Text style={[styles.nexusCode, { color: colors.primary }]}>ARENA // 04</Text>
          <Text style={[styles.nexusTitle, { color: colors.foreground }]}>Umbral de ceniza</Text>
          <Text style={[styles.nexusBody, { color: colors.mutedForeground }]}>Un rival aguarda en el borde de la tormenta.</Text>
          <View style={styles.nexusMeta}>
            <View style={styles.metaItem}><Ionicons name="flash-outline" size={15} color={colors.accent} /><Text style={[styles.metaText, { color: colors.foreground }]}>+125 VEX</Text></View>
            <View style={styles.metaItem}><Ionicons name="time-outline" size={15} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>5 MIN</Text></View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  kicker: { fontSize: 15, fontWeight: '700', letterSpacing: 3 },
  subtitle: { fontSize: 9, fontWeight: '600', letterSpacing: 2, marginTop: 3 },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 9, right: 10 },
  greeting: { marginTop: 37, marginBottom: 18 },
  connectionCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 25 },
  connectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 11 },
  connectionCopy: { flex: 1 },
  connectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  connectionBody: { fontSize: 11, marginTop: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', marginTop: 8 },
  resourceCard: { borderWidth: 1, borderRadius: 22, padding: 19, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontSize: 32, fontWeight: '700', letterSpacing: 0.5, marginTop: 3 },
  resourceLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 4 },
  resourceSide: { alignItems: 'flex-end' },
  resourcePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  pillText: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  missionCard: { borderWidth: 1, borderRadius: 20, padding: 15 },
  missionTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  missionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  missionCopy: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardBody: { fontSize: 12, marginTop: 3 },
  progressText: { fontSize: 12, fontWeight: '700' },
  claimButton: { height: 42, borderRadius: 12, marginTop: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  claimText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 },
  counter: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  nexusCard: { minHeight: 155, borderWidth: 1, borderRadius: 22, padding: 18, marginBottom: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end' },
  nexusGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, opacity: 0.12, top: -80, right: -30 },
  nexusContent: { flex: 1 },
  nexusCode: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  nexusTitle: { fontSize: 21, fontWeight: '700', marginTop: 9 },
  nexusBody: { fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 240 },
  nexusMeta: { flexDirection: 'row', gap: 18, marginTop: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
});
