import React, { useEffect } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { COLORS } from '../core/constants';

export function WorldTitle({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return <View style={styles.titleWrap}>
    <Text style={styles.kicker}>{kicker}</Text><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>;
}

export function SectionTitle({ kicker, title, right }: { kicker: string; title: string; right?: React.ReactNode }) {
  return <View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>{kicker}</Text><Text style={styles.sectionTitle}>{title}</Text></View>{right}</View>;
}

export function WorldObject({ children, accent = COLORS.gold, onPress, style }: { children: React.ReactNode; accent?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const content = <View style={[styles.object, { borderColor: `${accent}38`, shadowColor: accent }, style]}>{children}<View pointerEvents="none" style={[styles.corner, { borderColor: `${accent}24` }]} /></View>;
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export function RuneButton({ label, onPress, accent = COLORS.gold, disabled = false, icon }: { label: string; onPress?: () => void; accent?: string; disabled?: boolean; icon?: string }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { borderColor: `${accent}88`, backgroundColor: `${accent}${pressed ? '28' : '12'}` }, disabled && styles.disabled]}>
    {icon ? <Text style={[styles.buttonIcon, { color: accent }]}>{icon}</Text> : null}<Text style={styles.buttonText}>{label}</Text>
  </Pressable>;
}

export function StatSeal({ label, value, accent = COLORS.gold, compact = false }: { label: string; value: string | number; accent?: string; compact?: boolean }) {
  return <View style={[styles.seal, compact && styles.sealCompact, { borderColor: `${accent}3A`, backgroundColor: `${accent}0D` }]}>
    <Text style={[styles.sealValue, { color: accent }, compact && styles.sealValueCompact]}>{value}</Text><Text style={styles.sealLabel}>{label}</Text>
  </View>;
}

export function StatusPill({ label, accent = COLORS.gold }: { label: string; accent?: string }) {
  return <View style={[styles.pill, { borderColor: `${accent}44`, backgroundColor: `${accent}10` }]}><View style={[styles.dot, { backgroundColor: accent }]} /><Text style={[styles.pillText, { color: accent }]}>{label}</Text></View>;
}

export function Divider({ accent = COLORS.gold }: { accent?: string }) { return <View style={{ height: 1, backgroundColor: `${accent}20` }} />; }

export function AmbientSigil({ accent = COLORS.gold }: { accent?: string }) {
  const pulse = useSharedValue(0.92);
  useEffect(() => { pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.quad) }), withTiming(0.94, { duration: 1000, easing: Easing.inOut(Easing.quad) })), -1, false); }, [pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return <Animated.View style={[styles.sigil, { borderColor: `${accent}4A`, backgroundColor: `${accent}10` }, style]}><Text style={[styles.sigilText, { color: accent }]}>✦</Text></Animated.View>;
}

export function LoadingSeal({ label = 'SINCRONIZANDO CON EL NEXUS' }: { label?: string }) { return <WorldObject accent={COLORS.arcaneBright} style={styles.loading}><AmbientSigil accent={COLORS.arcaneBright} /><Text style={styles.loadingText}>{label}</Text></WorldObject>; }
export function ErrorSeal({ message }: { message: string }) { return <WorldObject accent={COLORS.crimson}><Text style={styles.errorTitle}>SEÑAL INTERRUMPIDA</Text><Text style={styles.errorText}>{message}</Text></WorldObject>; }

const styles = StyleSheet.create({
  titleWrap: { minHeight: 250, borderRadius: 32, borderWidth: 1, borderColor: `${COLORS.gold}40`, backgroundColor: 'rgba(4,4,7,.67)', justifyContent: 'flex-end', padding: 20, overflow: 'hidden' },
  kicker: { color: COLORS.gold, fontSize: 8, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: COLORS.white, fontSize: 30, fontWeight: '900', lineHeight: 34, marginTop: 6 },
  subtitle: { color: COLORS.parchment, fontSize: 10, lineHeight: 16, marginTop: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionKicker: { color: COLORS.goldDim, fontSize: 6.5, fontWeight: '900', letterSpacing: 1.9 },
  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '900', marginTop: 2 },
  object: { borderRadius: 22, borderWidth: 1, backgroundColor: 'rgba(6,6,10,.78)', padding: 14, overflow: 'hidden', shadowOpacity: 0.14, shadowRadius: 16, elevation: 3 },
  corner: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderRadius: 21 },
  button: { minHeight: 50, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonIcon: { fontSize: 15, fontWeight: '900' },
  buttonText: { color: COLORS.white, fontSize: 8.5, fontWeight: '900', letterSpacing: 1.1 },
  disabled: { opacity: 0.42 },
  seal: { minWidth: 76, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 8 },
  sealCompact: { minWidth: 60, paddingVertical: 6 },
  sealValue: { fontSize: 15, fontWeight: '900' },
  sealValueCompact: { fontSize: 12 },
  sealLabel: { color: COLORS.ash, fontSize: 5.5, fontWeight: '900', letterSpacing: 1, marginTop: 3 },
  pill: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 }, pillText: { fontSize: 6.5, fontWeight: '900', letterSpacing: 1 },
  sigil: { width: 48, height: 48, borderWidth: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, sigilText: { fontSize: 20, fontWeight: '900' },
  loading: { alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 24 }, loadingText: { color: COLORS.parchment, fontSize: 7, fontWeight: '900', letterSpacing: 1.4 },
  errorTitle: { color: COLORS.crimson, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 }, errorText: { color: COLORS.parchment, fontSize: 9, lineHeight: 14, marginTop: 5 },
});
