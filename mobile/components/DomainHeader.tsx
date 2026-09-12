import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Feather } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { DOMAIN_IDENTITY, MOTION, type DomainKey } from '@/constants/experience';

/**
 * Shared "place" header for the five VEXFORGE domains.
 *
 * Directive VE-UXCX-TIER1-2026: every domain must announce itself as a space
 * of the same world (sigil + place + title + purpose), never as an app screen
 * title. Screens pass their live data through `status` and `trailing`.
 */
export function DomainHeader({
  domain,
  status,
  trailing,
  children,
  style,
}: {
  domain: DomainKey;
  status?: string | null;
  trailing?: ReactNode;
  children?: ReactNode;
  style?: any;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const identity = DOMAIN_IDENTITY[domain];
  const tone = colors[identity.tone];

  return (
    <Animated.View
      testID={`domain-header-${domain}`}
      entering={reduceMotion ? undefined : FadeInDown.duration(MOTION.reveal)}
      style={[styles.root, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <View style={[styles.sigil, { borderColor: tone, backgroundColor: `${tone}14` }]}>
            <Feather name={identity.sigil as never} size={17} color={tone} />
          </View>
          <View style={styles.placeBlock}>
            <Text style={[styles.place, { color: tone }]}>{identity.place}</Text>
            <View style={[styles.rule, { backgroundColor: `${tone}55` }]} />
          </View>
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{identity.title}</Text>
      <Text style={[styles.purpose, { color: colors.mutedForeground }]}>
        {status ?? identity.purpose}
      </Text>
      {children ? <View style={styles.children}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  sigil: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBlock: { flexShrink: 1 },
  place: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  rule: { height: 1, width: 54, marginTop: 5, borderRadius: 1 },
  trailing: { marginLeft: 12 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: 14 },
  purpose: { fontSize: 13, marginTop: 5, lineHeight: 18 },
  children: { marginTop: 12 },
});
