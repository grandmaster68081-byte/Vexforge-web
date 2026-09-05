import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { ForgeIconName, VexIcon } from '@/components/ForgeIcon';

type DomainStateProps = {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message: string;
  icon?: ForgeIconName;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function DomainState({ kind, title, message, icon, actionLabel, onAction, testID }: DomainStateProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const accent = kind === 'error' ? colors.danger : kind === 'empty' ? colors.primary : colors.accent;
  const resolvedIcon = icon ?? (kind === 'error' ? 'warning' : kind === 'empty' ? 'collection' : 'resonance');

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(260)}
      testID={testID}
      accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
      style={[styles.container, { backgroundColor: `${colors.panel}D9`, borderColor: `${accent}66` }]}
    >
      {kind === 'loading' ? <ActivityIndicator color={accent} /> : <VexIcon name={resolvedIcon} size={34} color={accent} />}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            void Haptics.selectionAsync();
            onAction();
          }}
          style={[styles.action, { borderColor: accent }]}
        >
          <Text style={[styles.actionText, { color: accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    gap: 9,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: 0.4, textAlign: 'center' },
  message: { fontSize: 12, lineHeight: 18, maxWidth: 310, textAlign: 'center' },
  action: { borderWidth: 1, borderRadius: 10, marginTop: 3, paddingHorizontal: 12, paddingVertical: 9 },
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
