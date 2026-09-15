import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Feather } from '@/components/ForgeIcon';
import { useColors } from '@/hooks/useColors';
import { DOMAIN_IDENTITY, MOTION, VISUAL_TOKENS, type DomainKey } from '@/constants/experience';

/**
 * Shared "place" header for the five VEXFORGE domains.
 *
 * Directive VE-UXCX-TIER1-2026: every domain must announce itself as a space
 * of the same world (sigil + place + title + purpose), never as an app screen
 * title. Screens pass their live data through `status` and `trailing`.
 */
export function DomainHeader({
  domain,
  title,
  purpose,
  status,
  trailing,
  children,
  style,
}: {
  domain: DomainKey;
  title?: string;
  purpose?: string;
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
            <Feather name={identity.sigil as never} size={VISUAL_TOKENS.domainHeader.sigilIconSize} color={tone} />
          </View>
          <View style={styles.placeBlock}>
            <Text style={[styles.place, { color: tone }]}>{identity.place}</Text>
            <View style={[styles.rule, { backgroundColor: `${tone}55` }]} />
          </View>
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title ?? identity.title}</Text>
      <Text style={[styles.purpose, { color: colors.mutedForeground }]}>
        {status ?? purpose ?? identity.purpose}
      </Text>
      {children ? <View style={styles.children}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: VISUAL_TOKENS.domainHeader.rootPaddingBottom },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: VISUAL_TOKENS.domainHeader.identityGap, flexShrink: 1 },
  sigil: {
    width: VISUAL_TOKENS.domainHeader.sigilSize,
    height: VISUAL_TOKENS.domainHeader.sigilSize,
    borderRadius: VISUAL_TOKENS.domainHeader.sigilRadius,
    borderWidth: VISUAL_TOKENS.domainHeader.sigilStroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBlock: { flexShrink: 1 },
  place: {
    fontSize: VISUAL_TOKENS.domainHeader.place.fontSize,
    fontWeight: VISUAL_TOKENS.domainHeader.place.fontWeight,
    letterSpacing: VISUAL_TOKENS.domainHeader.place.letterSpacing,
  },
  rule: {
    height: VISUAL_TOKENS.border.hairline,
    width: VISUAL_TOKENS.domainHeader.ruleWidth,
    marginTop: VISUAL_TOKENS.domainHeader.ruleRadius + 4,
    borderRadius: VISUAL_TOKENS.domainHeader.ruleRadius,
  },
  trailing: { marginLeft: VISUAL_TOKENS.domainHeader.trailingMargin },
  title: {
    fontSize: VISUAL_TOKENS.domainHeader.title.fontSize,
    fontWeight: VISUAL_TOKENS.domainHeader.title.fontWeight,
    letterSpacing: VISUAL_TOKENS.domainHeader.title.letterSpacing,
    marginTop: VISUAL_TOKENS.domainHeader.titleTop,
  },
  purpose: {
    fontSize: VISUAL_TOKENS.domainHeader.purpose.fontSize,
    marginTop: VISUAL_TOKENS.domainHeader.purposeTop,
    lineHeight: VISUAL_TOKENS.domainHeader.purpose.lineHeight,
  },
  children: { marginTop: VISUAL_TOKENS.domainHeader.childrenTop },
});
