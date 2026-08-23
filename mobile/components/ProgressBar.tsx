import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

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
  track: { height: 6, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});