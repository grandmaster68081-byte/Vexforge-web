import React from 'react';
import Animated from 'react-native-reanimated';
import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';
import type { QualityTier } from '../types/game';

type Props = Omit<ExpoImageProps, 'contentFit' | 'cachePolicy' | 'transition'> & {
  quality?: QualityTier;
  transition?: number;
  cacheMode?: 'disk' | 'memory-disk';
};

export const AnimatedVexforgeImage = Animated.createAnimatedComponent(VexforgeImage);

export function VexforgeImage({ quality = 'HIGH', style, transition = 220, cacheMode = 'disk', ...props }: Props) {
  return (
    <ExpoImage
      {...props}
      contentFit="cover"
      cachePolicy={cacheMode}
      transition={transition}
      allowDownscaling
      style={[styles.base, style]}
    />
  );
}

const styles = StyleSheet.create({ base: { overflow: 'hidden' } });
