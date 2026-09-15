import type { ReactNode } from 'react';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { MOTION, VISUAL_TOKENS, type DomainTone } from '@/constants/experience';

type MaterialRole = keyof typeof VISUAL_TOKENS.material;

type MaterialPanelProps = ViewProps & {
  children?: ReactNode;
  materialRole?: MaterialRole;
  tone?: DomainTone;
  style?: StyleProp<ViewStyle>;
};

type ToneColorKey = 'accent' | 'primary' | 'danger' | 'success' | 'rarityEpic' | 'rarityRare';

const TONE_COLOR: Record<DomainTone, ToneColorKey> = {
  accent: 'accent',
  primary: 'primary',
  danger: 'danger',
  success: 'success',
  rarityEpic: 'rarityEpic',
  rarityRare: 'rarityRare',
};

function withAlpha(hex: string, opacity: number) {
  return `${hex}${Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

export function MaterialPanel({
  children,
  materialRole = 'panel',
  tone,
  style,
  ...props
}: MaterialPanelProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const material = VISUAL_TOKENS.material[materialRole];
  const borderColor = tone
    ? colors[TONE_COLOR[tone]]
    : colors.border;
  const accent = tone ? colors[TONE_COLOR[tone]] : colors.accent;
  const shadow = materialRole === 'focus'
    ? VISUAL_TOKENS.shadow.focus
    : materialRole === 'ambient'
      ? VISUAL_TOKENS.shadow.ambient
      : VISUAL_TOKENS.shadow.surface;

  return (
    <Animated.View
      {...props}
      entering={reduceMotion ? undefined : FadeIn.duration(MOTION.micro)}
      style={[
        styles.base,
        {
          backgroundColor: withAlpha(colors.panel, material.opacity),
          borderColor: withAlpha(
            borderColor,
            tone
              ? VISUAL_TOKENS.material.borderOpacity.toned
              : VISUAL_TOKENS.material.borderOpacity.neutral,
          ),
          borderWidth: tone ? VISUAL_TOKENS.border.standard : VISUAL_TOKENS.border.hairline,
          shadowColor: accent,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          elevation: shadow.elevation,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: VISUAL_TOKENS.radius.surface,
    padding: VISUAL_TOKENS.spacing.surface,
  },
});