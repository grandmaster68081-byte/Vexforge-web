import { Feather } from '@/components/ForgeIcon';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { DeckSlot } from '@/lib/supabase';
import { DomainState } from '@/components/DomainState';
import { VISUAL_TOKENS } from '@/constants/experience';

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
          {slot.image_url ? <Image source={{ uri: slot.image_url }} resizeMode="cover" style={styles.cardArt} /> : null}
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
            {slot.name}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {slot.faction} · {slot.rarity}
          </Text>
          <Text style={[styles.power, { color: accent }]}>{slot.power} PODER</Text>
        </>
      ) : (
        <Text style={[styles.emptyCard, { color: colors.mutedForeground }]}>
          {role === 'RESERVA' ? 'RESERVA VACÍA' : 'POSICIÓN VACÍA'}
        </Text>
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
        <DomainState kind="loading" title="Cargando formación real" message="El servidor está derivando tu formación para la Arena." testID="forgeformation-loading" />
      ) : error ? (
        <DomainState kind="error" title="Formación no disponible" message={error} actionLabel="REINTENTAR" onAction={onRetry} testID="forgeformation-error" />
      ) : ordered.length === 0 ? (
        <DomainState kind="empty" title="Formación vacía" message="Carga un mazo válido para activar el combate." testID="forgeformation-empty" />
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
  root: {
    borderWidth: VISUAL_TOKENS.border.standard,
    borderRadius: VISUAL_TOKENS.formation.root.radius,
    padding: VISUAL_TOKENS.formation.root.padding,
    gap: VISUAL_TOKENS.formation.root.gap,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.formation.heading.gap,
  },
  seal: {
    width: VISUAL_TOKENS.formation.seal.size,
    height: VISUAL_TOKENS.formation.seal.size,
    borderWidth: VISUAL_TOKENS.border.standard,
    borderRadius: VISUAL_TOKENS.formation.seal.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: { flex: 1 },
  kicker: {
    fontSize: VISUAL_TOKENS.formation.kicker.fontSize,
    fontWeight: '900',
    letterSpacing: VISUAL_TOKENS.formation.kicker.letterSpacing,
  },
  title: {
    fontSize: VISUAL_TOKENS.formation.title.fontSize,
    fontWeight: '900',
    marginTop: VISUAL_TOKENS.formation.title.marginTop,
  },
  count: { fontSize: VISUAL_TOKENS.formation.count.fontSize, fontWeight: '800' },
  copy: {
    fontSize: VISUAL_TOKENS.formation.copy.fontSize,
    lineHeight: VISUAL_TOKENS.formation.copy.lineHeight,
  },
  section: {
    fontSize: VISUAL_TOKENS.formation.section.fontSize,
    fontWeight: '900',
    letterSpacing: VISUAL_TOKENS.formation.section.letterSpacing,
    marginTop: VISUAL_TOKENS.formation.section.marginTop,
  },
  activeRow: { flexDirection: 'row', gap: VISUAL_TOKENS.formation.rows.gap },
  reserveRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VISUAL_TOKENS.formation.rows.gap,
  },
  card: {
    flex: 1,
    minWidth: VISUAL_TOKENS.formation.card.minWidth,
    borderWidth: VISUAL_TOKENS.border.standard,
    borderRadius: VISUAL_TOKENS.formation.card.radius,
    padding: VISUAL_TOKENS.formation.card.padding,
    gap: VISUAL_TOKENS.formation.card.gap,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: VISUAL_TOKENS.formation.cardHeader.gap,
  },
  cardArt: {
    width: '100%',
    height: VISUAL_TOKENS.formation.cardArt.height,
    borderRadius: VISUAL_TOKENS.formation.cardArt.radius,
    backgroundColor: VISUAL_TOKENS.formation.cardArt.placeholderBackground,
  },
  role: {
    flex: 1,
    fontSize: VISUAL_TOKENS.formation.role.fontSize,
    fontWeight: '900',
    letterSpacing: VISUAL_TOKENS.formation.role.letterSpacing,
  },
  name: {
    fontSize: VISUAL_TOKENS.formation.name.fontSize,
    lineHeight: VISUAL_TOKENS.formation.name.lineHeight,
    fontWeight: '800',
    minHeight: VISUAL_TOKENS.formation.name.minHeight,
  },
  meta: {
    fontSize: VISUAL_TOKENS.formation.meta.fontSize,
    lineHeight: VISUAL_TOKENS.formation.meta.lineHeight,
  },
  power: {
    fontSize: VISUAL_TOKENS.formation.power.fontSize,
    fontWeight: '900',
    marginTop: VISUAL_TOKENS.formation.power.marginTop,
  },
  emptyCard: {
    fontSize: VISUAL_TOKENS.formation.emptyCard.fontSize,
    lineHeight: VISUAL_TOKENS.formation.emptyCard.lineHeight,
    minHeight: VISUAL_TOKENS.formation.emptyCard.minHeight,
  },
  feedback: {
    minHeight: VISUAL_TOKENS.formation.feedback.minHeight,
    borderWidth: VISUAL_TOKENS.border.standard,
    borderColor: VISUAL_TOKENS.formation.feedback.borderColor,
    borderRadius: VISUAL_TOKENS.formation.feedback.radius,
    padding: VISUAL_TOKENS.formation.feedback.padding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.formation.feedback.gap,
  },
  feedbackText: {
    flex: 1,
    fontSize: VISUAL_TOKENS.formation.feedbackText.fontSize,
    fontWeight: '900',
    letterSpacing: VISUAL_TOKENS.formation.feedbackText.letterSpacing,
    lineHeight: VISUAL_TOKENS.formation.feedbackText.lineHeight,
  },
  retry: {
    borderWidth: VISUAL_TOKENS.border.standard,
    borderRadius: VISUAL_TOKENS.formation.retry.radius,
    paddingHorizontal: VISUAL_TOKENS.formation.retry.paddingHorizontal,
    paddingVertical: VISUAL_TOKENS.formation.retry.paddingVertical,
  },
  retryText: {
    fontSize: VISUAL_TOKENS.formation.retryText.fontSize,
    fontWeight: '900',
    letterSpacing: VISUAL_TOKENS.formation.retryText.letterSpacing,
  },
  footnote: {
    fontSize: VISUAL_TOKENS.formation.footnote.fontSize,
    lineHeight: VISUAL_TOKENS.formation.footnote.lineHeight,
  },
});