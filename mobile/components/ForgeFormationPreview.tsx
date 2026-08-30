import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { DeckSlot } from '@/lib/supabase';

type FormationRole = 'VANGUARDIA' | 'CAMPEÓN' | 'CENTINELA' | 'RESERVA';
type FormationColors = ReturnType<typeof useColors>;

type Props = {
  slots: DeckSlot[];
  loading: boolean;
  error: string | null;
  colors: FormationColors;
  onRetry: () => void;
};

function roleColor(role: FormationRole, colors: FormationColors) {
  if (role === 'CAMPEÓN') return colors.accent;
  if (role === 'VANGUARDIA') return colors.danger;
  if (role === 'CENTINELA') return colors.primary;
  return colors.mutedForeground;
}

function FormationCard({
  slot,
  role,
  colors,
}: {
  slot: DeckSlot | null;
  role: FormationRole;
  colors: FormationColors;
}) {
  const accent = roleColor(role, colors);
  return (
    <View
      testID={'forgeformation-slot-' + role.toLowerCase()}
      style={[
        styles.card,
        { backgroundColor: colors.panel, borderColor: slot ? accent : colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.role, { color: accent }]}>{role}</Text>
        <Feather
          name={role === 'CAMPEÓN' ? 'award' : role === 'RESERVA' ? 'layers' : 'shield'}
          size={15}
          color={accent}
        />
      </View>
      {slot ? (
        <>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
            {slot.name}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {slot.faction} · {slot.rarity}
          </Text>
          <Text style={[styles.power, { color: accent }]}>{slot.power} PODER</Text>
        </>
      ) : (
        <Text style={[styles.emptyCard, { color: colors.mutedForeground }]}>Sin unidad</Text>
      )}
    </View>
  );
}

export function ForgeFormationPreview({
  slots,
  loading,
  error,
  colors,
  onRetry,
}: Props) {
  const ordered = [...slots]
    .sort(
      (left, right) =>
        Number(right.is_champion) - Number(left.is_champion) || right.power - left.power,
    )
    .slice(0, 8);
  const champion = ordered.find((slot) => slot.is_champion) ?? ordered[0] ?? null;
  const nonChampions = champion
    ? ordered.filter((slot) => slot.card_id !== champion.card_id)
    : [];
  const reserve = nonChampions.slice(2);

  return (
    <View
      testID="forgeformation-preview"
      style={[
        styles.root,
        { backgroundColor: colors.panelStrong, borderColor: colors.primary },
      ]}
    >
      <View style={styles.heading}>
        <View
          style={[
            styles.seal,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <Feather name="zap" size={17} color={colors.primaryForeground} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>SISTEMA CENTRAL</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>ForgeFormation</Text>
        </View>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {ordered.length}/8
        </Text>
      </View>
      <Text style={[styles.copy, { color: colors.mutedForeground }]}>
        Esta es la formación que el servidor deriva de tu mazo real al resolver el
        combate. El dispositivo sólo la presenta: no calcula daño, turnos ni ganador.
      </Text>
      {loading ? (
        <View style={styles.feedback}>
          <Feather name="loader" size={17} color={colors.primary} />
          <Text style={[styles.feedbackText, { color: colors.mutedForeground }]}>
            CARGANDO FORMACIÓN REAL
          </Text>
        </View>
      ) : error ? (
        <View style={styles.feedback}>
          <Feather name="alert-circle" size={17} color={colors.danger} />
          <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={[styles.retry, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.foreground }]}>REINTENTAR</Text>
          </Pressable>
        </View>
      ) : ordered.length === 0 ? (
        <View style={styles.feedback}>
          <Feather name="inbox" size={17} color={colors.mutedForeground} />
          <Text style={[styles.feedbackText, { color: colors.mutedForeground }]}>
            CARGA UN MAZO VÁLIDO PARA ACTIVAR EL COMBATE
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.section, { color: colors.mutedForeground }]}>LÍNEA ACTIVA</Text>
          <View style={styles.activeRow}>
            <FormationCard
              slot={nonChampions[0] ?? null}
              role="VANGUARDIA"
              colors={colors}
            />
            <FormationCard slot={champion} role="CAMPEÓN" colors={colors} />
            <FormationCard
              slot={nonChampions[1] ?? null}
              role="CENTINELA"
              colors={colors}
            />
          </View>
          <Text style={[styles.section, { color: colors.mutedForeground }]}>
            RESERVA · BONIFICACIÓN DEL CAMPEÓN
          </Text>
          <View style={styles.reserveRow}>
            {reserve.length > 0 ? (
              reserve.map((slot) => (
                <FormationCard key={slot.card_id} slot={slot} role="RESERVA" colors={colors} />
              ))
            ) : (
              <FormationCard slot={null} role="RESERVA" colors={colors} />
            )}
          </View>
          <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
            El RPC oficial aplica la reserva, los efectos de formación, las guardias y la
            condición de muerte del Campeón.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seal: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: { flex: 1 },
  kicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { fontSize: 19, fontWeight: '900', marginTop: 2 },
  count: { fontSize: 11, fontWeight: '800' },
  copy: { fontSize: 11, lineHeight: 17 },
  section: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 3 },
  activeRow: { flexDirection: 'row', gap: 6 },
  reserveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  card: { flex: 1, minWidth: 92, borderWidth: 1, borderRadius: 12, padding: 8, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  role: { flex: 1, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  name: { fontSize: 11, lineHeight: 14, fontWeight: '800', minHeight: 28 },
  meta: { fontSize: 8, lineHeight: 12 },
  power: { fontSize: 8, fontWeight: '900', marginTop: 2 },
  emptyCard: { fontSize: 10, lineHeight: 14, minHeight: 28 },
  feedback: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: { flex: 1, fontSize: 9, fontWeight: '900', letterSpacing: 0.4, lineHeight: 14 },
  retry: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 },
  retryText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  footnote: { fontSize: 9, lineHeight: 14 },
});