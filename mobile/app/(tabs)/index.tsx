import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/ScreenShell';

const HOME_REFERENCE_BACKGROUND = require('../../assets/images/home-reference-scene.png');

type HomeRoute = '/' | '/battle' | '/collection' | '/deck' | '/missions' | '/world' | '/profile' | '/store?mode=fusion';

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
  { id: 'forge', label: 'Entrar a la Forja', route: '/store?mode=fusion', left: '0%', top: '27%', width: '35%', height: '14%' },
  { id: 'arena', label: 'Entrar a Arena', route: '/battle', left: '68%', top: '28%', width: '32%', height: '14%' },
  { id: 'featured-card', label: 'Abrir Cartas', route: '/collection', left: '32%', top: '42%', width: '36%', height: '15%' },
  { id: 'world', label: 'Explorar Mundo', route: '/world', left: '0%', top: '55%', width: '34%', height: '15%' },
  { id: 'archive', label: 'Abrir Archivo', route: '/collection', left: '68%', top: '55%', width: '32%', height: '15%' },
  { id: 'event', label: 'Abrir evento especial', route: '/world', left: '5%', top: '73%', width: '45%', height: '14%' },
  { id: 'mission', label: 'Abrir misión', route: '/missions', left: '65%', top: '73%', width: '35%', height: '14%' },
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

  const routeTo = (route: HomeRoute) => {
    if (route === '/') {
      router.replace('/');
      return;
    }
    router.push(route);
  };

  const sceneHeight = Math.max(1, viewportHeight);

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <View style={[styles.screen, { marginBottom: -insets.bottom }]}>
        <Animated.View
          style={[styles.scene, { width: viewportWidth, height: sceneHeight, marginTop: 0 }]}
          entering={reduceMotion ? undefined : FadeIn.duration(450)}
          testID="home-reference-scene"
        >
          <Image
            source={HOME_REFERENCE_BACKGROUND}
            style={styles.sceneImage}
            resizeMode="stretch"
            accessibilityLabel="Escena de Home proporcionada por el operador"
          />
          <View style={styles.hotspotLayer} accessibilityLabel="Acciones visibles del Inicio de VEXFORGE">
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
        </Animated.View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
