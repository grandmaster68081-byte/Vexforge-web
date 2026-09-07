import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadHomeStats, type HomeStats } from '@/lib/supabase';
import { ScreenShell } from '@/components/ScreenShell';

const HOME_REFERENCE_BACKGROUND = require('../../../assets/images/home-reference-scene.png');

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
  { id: 'player-profile', label: 'Abrir perfil del forjador', route: '/profile', left: '10%', top: '0%', width: '24%', height: '7%' },
  { id: 'energy-economy', label: 'Abrir economía y energía', route: '/economy', left: '45%', top: '0%', width: '18%', height: '7%' },
  { id: 'vex-economy', label: 'Abrir cartera VEX', route: '/economy', left: '63%', top: '0%', width: '18%', height: '7%' },
  { id: 'messages', label: 'Abrir mensajes del Nexus', route: '/social', left: '84%', top: '0%', width: '8%', height: '7%' },
  { id: 'settings', label: 'Abrir ajustes de cuenta', route: '/meta', left: '92%', top: '0%', width: '8%', height: '7%' },
  { id: 'season', label: 'Abrir temporada activa', route: '/world', left: '0%', top: '5%', width: '46%', height: '11%' },
  { id: 'daily-mission', label: 'Abrir misión diaria', route: '/missions', left: '66%', top: '5%', width: '34%', height: '11%' },
  { id: 'forge', label: 'Entrar a Foja', route: '/', left: '0%', top: '19%', width: '29%', height: '24%' },
  { id: 'arena', label: 'Entrar a Arena', route: '/battle', left: '70%', top: '19%', width: '30%', height: '24%' },
  { id: 'featured-card', label: 'Inspeccionar carta destacada', route: '/collection', left: '32%', top: '22%', width: '37%', height: '30%' },
  { id: 'archive', label: 'Abrir Archivo', route: '/collection', left: '0%', top: '40%', width: '34%', height: '27%' },
  { id: 'deck', label: 'Entrar a Forja', route: '/deck', left: '70%', top: '40%', width: '30%', height: '27%' },
  { id: 'event', label: 'Abrir evento especial', route: '/world', left: '0%', top: '65%', width: '55%', height: '18%' },
  { id: 'mission', label: 'Abrir misión', route: '/missions', left: '55%', top: '65%', width: '45%', height: '18%' },
  { id: 'ritual', label: 'Continuar tu rito', route: '/tutorial', left: '20%', top: '81%', width: '66%', height: '9%' },
];

export default function ForgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        entering={reduceMotion ? undefined : FadeIn.duration(450)}
      >
        <View style={styles.scene} testID="home-reference-scene">
          <Image
            source={HOME_REFERENCE_BACKGROUND}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
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
  scene: {
    width: '100%',
    aspectRatio: 941 / 1538,
    overflow: 'hidden',
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
