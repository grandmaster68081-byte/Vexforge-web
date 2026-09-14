import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { ForgeIconName, VexIcon } from '@/components/ForgeIcon';
import { MaterialPanel } from '@/components/MaterialPanel';
import { VISUAL_TOKENS } from '@/constants/experience';

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
  const accent = kind === 'error' ? colors.danger : kind === 'empty' ? colors.primary : colors.accent;
  const resolvedIcon = icon ?? (kind === 'error' ? 'warning' : kind === 'empty' ? 'collection' : 'resonance');

  return (
    <MaterialPanel
      testID={testID}
      accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
      materialRole={kind === 'error' ? 'focus' : 'panel'}
      tone={kind === 'error' ? 'danger' : kind === 'empty' ? 'primary' : 'accent'}
      style={styles.container}
    >
      {kind === 'loading' ? (
        <>
          <ActivityIndicator color={accent} />
          <View accessibilityLabel="Cargando contenido" style={styles.skeleton} pointerEvents="none">
            <View style={[styles.skeletonLine, styles.skeletonLineLong, { backgroundColor: `${accent}2E` }]} />
            <View style={[styles.skeletonLine, { backgroundColor: `${accent}1F` }]} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort, { backgroundColor: `${accent}1F` }]} />
          </View>
        </>
      ) : <VexIcon name={resolvedIcon} size={34} color={accent} />}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          testID={testID ? `${testID}-action` : undefined}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => undefined);
            onAction();
          }}
          style={[styles.action, { borderColor: accent }]}
        >
          <Text style={[styles.actionText, { color: accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </MaterialPanel>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: VISUAL_TOKENS.state.gap,
    marginTop: VISUAL_TOKENS.state.marginTop,
    paddingHorizontal: VISUAL_TOKENS.state.paddingHorizontal,
    paddingVertical: VISUAL_TOKENS.state.paddingVertical,
  },
  skeleton: {
    width: VISUAL_TOKENS.state.skeletonWidth,
    gap: VISUAL_TOKENS.state.skeletonGap,
    marginTop: VISUAL_TOKENS.state.skeletonMargin,
    marginBottom: VISUAL_TOKENS.state.skeletonMargin,
  },
  skeletonLine: {
    height: VISUAL_TOKENS.state.skeletonHeight,
    width: '100%',
    borderRadius: VISUAL_TOKENS.state.skeletonRadius,
  },
  skeletonLineLong: { width: '88%' },
  skeletonLineShort: { width: '62%' },
  title: {
    fontSize: VISUAL_TOKENS.state.titleSize,
    fontWeight: '800',
    letterSpacing: VISUAL_TOKENS.state.titleTracking,
    textAlign: 'center',
  },
  message: {
    fontSize: VISUAL_TOKENS.state.messageSize,
    lineHeight: VISUAL_TOKENS.state.messageLineHeight,
    maxWidth: VISUAL_TOKENS.state.messageMaxWidth,
    textAlign: 'center',
  },
  action: {
    borderWidth: VISUAL_TOKENS.border.hairline,
    borderRadius: VISUAL_TOKENS.state.actionRadius,
    marginTop: VISUAL_TOKENS.state.actionTop,
    paddingHorizontal: VISUAL_TOKENS.state.actionHorizontalPadding,
    paddingVertical: VISUAL_TOKENS.state.actionVerticalPadding,
  },
  actionText: {
    fontSize: VISUAL_TOKENS.state.actionTextSize,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
