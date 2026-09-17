import { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import type { SyncState } from '@/context/GameContext';
import { animateSceneEntrance } from '@/game/motion/GameMotion';

type BootSceneProps = {
  authLoading: boolean;
  syncState: SyncState;
  onRetry?: () => void;
};

export function BootScene({ authLoading, syncState, onRetry }: BootSceneProps) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const entrance = useSharedValue(0);

  useEffect(() => {
    animateSceneEntrance(entrance, reduceMotion);
  }, [entrance, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 12 }],
  }));
  const isOffline = syncState === 'offline';
  const title = authLoading
    ? 'INICIALIZANDO SESIÓN'
    : isOffline
      ? 'NEXUS NO DISPONIBLE'
      : 'PREPARANDO NEXUS';
  const body = authLoading
    ? 'Comprobando el acceso del jugador.'
    : isOffline
      ? 'No se recibieron datos reales. Revisa la conexión e inténtalo de nuevo.'
      : 'Esperando la sesión y los datos reales del jugador.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="game-boot-scene">
      <View style={[styles.halo, { borderColor: `${colors.accent}3D` }]} />
      <Animated.View style={[styles.content, animatedStyle]}>
        <Image
          source={require('../../assets/images/icon.jpg')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityLabel="Emblema oficial de VEXFORGE"
        />
        <Text style={[styles.kicker, { color: colors.accent }]}>VEXFORGE / GAME RUNTIME</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
        {isOffline ? (
          <Pressable
            onPress={onRetry}
            style={[styles.retry, { borderColor: `${colors.accent}A8`, backgroundColor: `${colors.accent}16` }]}
            accessibilityRole="button"
            accessibilityLabel="Reintentar conexión con Nexus"
          >
            <Text style={[styles.retryLabel, { color: colors.accent }]}>REINTENTAR</Text>
          </Pressable>
        ) : (
          <ActivityIndicator color={colors.accent} style={styles.spinner} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 32,
  },
  halo: {
    borderRadius: 280,
    borderWidth: 1,
    height: 420,
    position: 'absolute',
    width: 420,
  },
  content: {
    alignItems: 'center',
    maxWidth: 360,
  },
  mark: {
    borderRadius: 18,
    height: 112,
    marginBottom: 28,
    width: 112,
  },
  kicker: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 12,
    letterSpacing: 2.4,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 24,
    marginTop: 12,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 28,
  },
  retry: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryLabel: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});