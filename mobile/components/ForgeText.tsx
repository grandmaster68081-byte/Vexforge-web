import { Text, type TextProps, type TextStyle } from 'react-native';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

type ForgeTextVariant = 'display' | 'title' | 'section' | 'body' | 'meta' | 'label';
type ForgeTextTone = 'foreground' | 'muted' | 'accent' | 'primary' | 'danger' | 'success';

const variantStyles: Record<ForgeTextVariant, TextStyle> = {
  display: { fontFamily: typography.display, fontSize: 38, lineHeight: 44, letterSpacing: 0.2 },
  title: { fontFamily: typography.display, fontSize: 26, lineHeight: 32, letterSpacing: 0.1 },
  section: { fontFamily: typography.display, fontSize: 20, lineHeight: 25 },
  body: { fontFamily: typography.body, fontSize: 16, lineHeight: 21 },
  meta: { fontFamily: typography.bodySemiBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.9 },
  label: { fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 13, letterSpacing: 1.5 },
};

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

  return <Text {...props} style={[variantStyles[variant], { color: toneColors[tone] }, style]} />;
}
