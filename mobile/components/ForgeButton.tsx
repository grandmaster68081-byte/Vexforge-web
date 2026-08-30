import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { ForgeText } from '@/components/ForgeText';

type ForgeButtonProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function ForgeButton({ label, icon, onPress, secondary = false, disabled = false, testID }: ForgeButtonProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      testID={testID}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.pressable, { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }]}
    >
      {secondary ? (
        <View style={[styles.surface, { borderColor: colors.accent, backgroundColor: `${colors.ink}CC` }]}>
          {icon ? <Ionicons name={icon} size={16} color={colors.accent} /> : null}
          <ForgeText variant="label" tone="accent">{label}</ForgeText>
        </View>
      ) : (
        <LinearGradient colors={[colors.accent, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.surface}>
          {icon ? <Ionicons name={icon} size={16} color={colors.ink} /> : null}
          <ForgeText variant="label" style={{ color: colors.ink }}>{label}</ForgeText>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  surface: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
