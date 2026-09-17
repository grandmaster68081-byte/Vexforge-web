import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type GameRenderSurfaceProps = {
  children: ReactNode;
};

/**
 * The runtime renderer boundary. Native React Native views are the first
 * implementation; a future scene renderer can replace this boundary without
 * moving data authority or game rules into the presentation layer.
 */
export function GameRenderSurface({ children }: GameRenderSurfaceProps) {
  return (
    <View style={styles.surface} testID="game-render-surface" accessibilityLabel="Superficie de juego">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
});