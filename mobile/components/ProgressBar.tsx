import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VISUAL_TOKENS } from '@/constants/experience';

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.track, { backgroundColor: colors.muted }]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color ?? colors.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: VISUAL_TOKENS.control.progress.height,
    borderRadius: VISUAL_TOKENS.control.progress.radius,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: VISUAL_TOKENS.control.progress.radius,
  },
});