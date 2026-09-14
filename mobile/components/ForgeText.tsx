import { Text, type TextProps } from 'react-native';
import { VISUAL_TOKENS } from '@/constants/experience';
import { useColors } from '@/hooks/useColors';

type ForgeTextVariant = 'display' | 'title' | 'section' | 'body' | 'meta' | 'label';
type ForgeTextTone = 'foreground' | 'muted' | 'accent' | 'primary' | 'danger' | 'success';

export function ForgeText({
  variant = 'body',
  tone = 'foreground',
  style,
  ...props
}: TextProps & { variant?: ForgeTextVariant; tone?: ForgeTextTone }) {
  const colors = useColors();
  const toneColors: Record<ForgeTextTone, string> = {
    foreground: colors.foreground,
    muted: colors.mutedForeground,
    accent: colors.accent,
    primary: colors.primary,
    danger: colors.danger,
    success: colors.success,
  };

  return <Text {...props} style={[VISUAL_TOKENS.typography[variant], { color: toneColors[tone] }, style]} />;
}
