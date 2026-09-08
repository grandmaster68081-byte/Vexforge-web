import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadHomeStats, type HomeStats } from '@/lib/supabase';
import { ScreenShell } from '@/components/ScreenShell';

const HOME_REFERENCE_BACKGROUND = require('../../assets/images/home-reference-scene.png');
const HOME_REFERENCE_WIDTH = 1024;
const HOME_REFERENCE_HEIGHT = 1536;

type HomeRoute = '/' | '/battle' | '/collection' | '/deck' | '/missions' | '/world' | '/profile' | '/tutorial' | '/economy' | '/social' | '/meta';

type Hotspot = {
  id: string;
  label: string;
  route: HomeRoute;
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
};

const HOTSPOTS: Hotspot[] = [
  { id: 'player-profile', label: 'Abrir perfil del forjador', route: '/profile', left: '1%', top: '0%', width: '36%', height: '7%' },
  { id: 'energy-economy', label: 'Abrir economía y energía', route: '/economy', left: '38%', top: '0%', width: '14%', height: '7%' },
  { id: 'vex-economy', label: 'Abrir cartera VEX', route: '/economy', left: '51%', top: '0%', width: '14%', height: '7%' },
  { id: 'settings', label: 'Abrir ajustes de cuenta', route: '/meta', left: '61%', top: '0%', width: '14%', height: '7%' },
  { id: 'season', label: 'Abrir temporada activa', route: '/world', left: '70%', top: '4%', width: '29%', height: '10%' },
  { id: 'forge', label: 'Entrar a Foja', route: '/', left: '1%', top: '18%', width: '29%', height: '22%' },
  { id: 'arena', label: 'Entrar a Arena', route: '/battle', left: '70%', top: '18%', width: '29%', height: '23%' },
  { id: 'featured-card', label: 'Inspeccionar carta destacada', route: '/collection', left: '27%', top: '21%', width: '44%', height: '29%' },
  { id: 'world', label: 'Explorar Mundo', route: '/world', left: '1%', top: '39%', width: '29%', height: '22%' },
  { id: 'archive', label: 'Abrir Archivo', route: '/collection', left: '70%', top: '40%', width: '29%', height: '22%' },
  { id: 'event', label: 'Abrir evento especial', route: '/world', left: '7%', top: '63%', width: '42%', height: '18%' },
  { id: 'mission', label: 'Abrir misión', route: '/missions', left: '67%', top: '63%', width: '32%', height: '18%' },
  { id: 'navigation-home', label: 'Ir a Inicio', route: '/', left: '0%', top: '91%', width: '20%', height: '9%' },
  { id: 'navigation-battle', label: 'Ir a Batalla', route: '/battle', left: '20%', top: '91%', width: '20%', height: '9%' },
  { id: 'navigation-cards', label: 'Ir a Cartas', route: '/collection', left: '40%', top: '91%', width: '20%', height: '9%' },
  { id: 'navigation-deck', label: 'Ir a Mazo', route: '/deck', left: '60%', top: '91%', width: '20%', height: '9%' },
  { id: 'navigation-profile', label: 'Ir a Perfil', route: '/profile', left: '80%', top: '91%', width: '20%', height: '9%' },
];

export default function ForgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [homeError, setHomeError] = useState<string | null>(null);

  const loadHome = useCallback(async () => {
    try {
      setHomeError(null);
      setHomeStats(await loadHomeStats());
    } catch (error) {
      setHomeError(error instanceof Error ? error.message : 'No se pudo sincronizar Foja.');
    }
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const routeTo = (route: HomeRoute) => {
    if (route === '/') {
      router.replace('/');
      return;
    }
    router.push(route);
  };

  const accessibilitySummary = homeStats
    ? `Temporada ${homeStats.season?.name ?? 'activa'}, ${homeStats.total_cards} cartas, ${homeStats.active_players} jugadores activos.`
    : homeError ?? 'Sincronizando datos de Foja.';
  const sceneHeight = viewportWidth * (HOME_REFERENCE_HEIGHT / HOME_REFERENCE_WIDTH);

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.contentContainer,
          {
            minHeight: Math.max(viewportHeight, sceneHeight + insets.bottom),
            paddingBottom: insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        entering={reduceMotion ? undefined : FadeIn.duration(450)}
      >
        <View
          style={[styles.scene, { width: viewportWidth, height: sceneHeight }]}
          testID="home-reference-scene"
        >
          <Image
            source={HOME_REFERENCE_BACKGROUND}
            style={styles.sceneImage}
            resizeMode="stretch"
            accessibilityLabel="Escena de Home proporcionada por el operador"
          />
          <View style={styles.hotspotLayer} accessibilityLabel={accessibilitySummary}>
            {HOTSPOTS.map((hotspot) => (
              <Pressable
                key={hotspot.id}
                accessibilityRole="button"
                accessibilityLabel={hotspot.label}
                accessibilityHint="Toca dos veces para abrir esta sección."
                hitSlop={8}
                testID={`home-reference-${hotspot.id}`}
                onPress={() => routeTo(hotspot.route)}
                style={({ pressed }) => [
                  styles.hotspot,
                  {
                    left: hotspot.left,
                    top: hotspot.top,
                    width: hotspot.width,
                    height: hotspot.height,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  contentContainer: {
    alignItems: 'flex-start',
  },
  scene: {
    overflow: 'hidden',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  hotspotLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  hotspot: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
});
