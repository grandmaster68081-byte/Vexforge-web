import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadHomeStats, type HomeStats } from '@/lib/supabase';
import { ScreenShell } from '@/components/ScreenShell';
import { useGame } from '@/context/GameContext';

const HOME_REFERENCE_BACKGROUND = require('../../assets/images/home-reference-scene.png');

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
  const { player, session, progress, wallet } = useGame();
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
  const sceneHeight = Math.max(1, viewportHeight - insets.top - insets.bottom);
  const displayName = player?.display_name?.trim() || session?.user.email?.split('@')[0] || 'Forjador';
  const levelLabel = progress ? `NIVEL ${progress.level}` : 'NIVEL —';
  const energyLabel = progress ? `${progress.energy}/${progress.max_energy}` : '—/—';
  const vexLabel = wallet ? Math.round(wallet.vex_ingame).toLocaleString('es-ES') : '—';

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <View style={[styles.screen, { marginBottom: -insets.bottom }]}>
        <View
          style={[styles.scene, { width: viewportWidth, height: sceneHeight, marginTop: insets.top }]}
          testID="home-reference-scene"
        >
          <Image
            source={HOME_REFERENCE_BACKGROUND}
            style={styles.sceneImage}
            resizeMode="stretch"
            accessibilityLabel="Escena de Home proporcionada por el operador"
          />
          <View style={styles.hotspotLayer} accessibilityLabel={accessibilitySummary}>
            <View
              pointerEvents="none"
              accessible
              accessibilityLabel={`Jugador ${displayName}, ${levelLabel}, energía ${energyLabel}, ${vexLabel} VEX`}
              style={styles.playerData}
            >
              <View style={styles.playerDataRule} />
              <View style={styles.playerDataText}>
                <Text numberOfLines={1} style={styles.playerName}>@{displayName}</Text>
                <Text numberOfLines={1} style={styles.playerMeta}>{levelLabel}</Text>
              </View>
            </View>
            <Text pointerEvents="none" style={[styles.energyValue, { color: '#F4F6FF' }]}>{energyLabel}</Text>
            <Text pointerEvents="none" style={[styles.vexValue, { color: '#F4F6FF' }]}>{vexLabel}</Text>
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
      </View>
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
  playerData: {
    position: 'absolute',
    left: '3%',
    top: '11.5%',
    width: '35%',
    height: '7%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerDataRule: {
    width: 2,
    height: '62%',
    backgroundColor: '#F0C050',
    shadowColor: '#F0C050',
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  playerDataText: {
    minWidth: 0,
    marginLeft: 7,
    paddingRight: 5,
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  playerMeta: {
    color: '#F0C050',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  energyValue: {
    position: 'absolute',
    left: '65.5%',
    top: '3.1%',
    width: '11%',
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  vexValue: {
    position: 'absolute',
    left: '78%',
    top: '3.1%',
    width: '13%',
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hotspot: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
});
