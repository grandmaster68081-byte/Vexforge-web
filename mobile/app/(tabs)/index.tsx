import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/ScreenShell';
import { getCanonicalFrameMetrics } from '@/components/CanonicalFrame';

const HOME_REFERENCE_BACKGROUND = require('../../assets/images/home-reference-scene.png');

type HomeRoute =
  | '/'
  | '/battle'
  | '/collection'
  | '/deck'
  | '/missions'
  | '/profile'
  | '/meta'
  | '/store?mode=fusion'
  | '/store?mode=shop'
  | '/store?mode=evolution'
  | '/store?mode=packs';

type Hotspot = {
  id: string;
  label: string;
  route: HomeRoute | null;
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
  color: string;
};

type TapMarker = { x: number; y: number; color: string };

const HOTSPOTS: Hotspot[] = [
  { id: 'settings', label: 'Abrir ajustes', route: '/meta', left: '79%', top: '1%', width: '10%', height: '8%', color: '#FFD98A' },
  { id: 'inbox', label: 'Abrir avisos y misiones', route: '/missions', left: '89%', top: '1%', width: '11%', height: '8%', color: '#FFB86B' },
  { id: 'forge', label: 'Abrir Forja de mazos', route: '/deck', left: '0%', top: '26%', width: '42%', height: '15%', color: '#75C9FF' },
  { id: 'arena', label: 'Entrar a Arena', route: '/battle', left: '60%', top: '26%', width: '40%', height: '15%', color: '#FFB04D' },
  { id: 'fusion', label: 'Abrir Fusión', route: '/store?mode=fusion', left: '12%', top: '41%', width: '52%', height: '15%', color: '#D98BFF' },
  { id: 'archive', label: 'Abrir Archivo', route: '/collection', left: '60%', top: '52%', width: '40%', height: '14%', color: '#FFD98A' },
  { id: 'shop', label: 'Abrir Tienda', route: '/store?mode=shop', left: '0%', top: '63%', width: '42%', height: '15%', color: '#FFB86B' },
  { id: 'evolution', label: 'Abrir Evolución', route: '/store?mode=evolution', left: '59%', top: '67%', width: '41%', height: '15%', color: '#75E6FF' },
  { id: 'packs', label: 'Abrir Packs', route: '/store?mode=packs', left: '0%', top: '78%', width: '42%', height: '14%', color: '#77BFFF' },
  { id: 'videos', label: 'Abrir Videos', route: null, left: '59%', top: '78%', width: '41%', height: '14%', color: '#B28BFF' },
  { id: 'navigation-home', label: 'Ir a Inicio', route: '/', left: '0%', top: '91%', width: '20%', height: '9%', color: '#FFD98A' },
  { id: 'navigation-battle', label: 'Ir a Batalla', route: '/battle', left: '20%', top: '91%', width: '20%', height: '9%', color: '#FFB04D' },
  { id: 'navigation-cards', label: 'Ir a Cartas', route: '/collection', left: '40%', top: '91%', width: '20%', height: '9%', color: '#75C9FF' },
  { id: 'navigation-shop', label: 'Ir a Tienda', route: '/store?mode=shop', left: '60%', top: '91%', width: '20%', height: '9%', color: '#FFB86B' },
  { id: 'navigation-profile', label: 'Ir a Perfil', route: '/profile', left: '80%', top: '91%', width: '20%', height: '9%', color: '#D98BFF' },
];

export default function ForgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const tapProgress = useSharedValue(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapMarker, setTapMarker] = useState<TapMarker | null>(null);

  const { width: frameWidth, height: sceneHeight } = getCanonicalFrameMetrics(
    viewportWidth,
    Math.max(1, viewportHeight - insets.top - insets.bottom),
  );

  useEffect(() => () => {
    if (tapTimeout.current) clearTimeout(tapTimeout.current);
  }, []);

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.88 : 0.9 - tapProgress.value * 0.9,
    transform: [{ scale: reduceMotion ? 1 : 0.72 + tapProgress.value * 0.86 }],
  }));

  const handlePressIn = (event: GestureResponderEvent, hotspot: Hotspot) => {
    const x = Math.min(
      frameWidth - 32,
      Math.max(32, frameWidth * (Number.parseFloat(hotspot.left) / 100) + event.nativeEvent.locationX),
    );
    const y = Math.min(
      sceneHeight - 32,
      Math.max(32, sceneHeight * (Number.parseFloat(hotspot.top) / 100) + event.nativeEvent.locationY),
    );
    setTapMarker({ x, y, color: hotspot.color });
    tapProgress.value = 0;
    tapProgress.value = withTiming(1, {
      duration: reduceMotion ? 1 : 420,
      easing: Easing.out(Easing.cubic),
    });
    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => setTapMarker(null), reduceMotion ? 650 : 520);
    void Haptics.selectionAsync();
  };

  const routeTo = (route: HomeRoute | null) => {
    if (!route) {
      Alert.alert('VIDEOS', 'Esta sección todavía no tiene una pantalla Android activa.');
      return;
    }
    if (route === '/') {
      router.replace('/');
      return;
    }
    router.push(route);
  };

  return (
    <ScreenShell surface="home" sceneMode="hero">
      <View style={[styles.screen, { marginBottom: -insets.bottom }]}>
        <Animated.View
          style={[styles.scene, { width: frameWidth, height: sceneHeight, marginTop: insets.top, alignSelf: 'center' }]}
          entering={reduceMotion ? undefined : FadeIn.duration(450)}
          testID="home-reference-scene"
        >
          <Image
            source={HOME_REFERENCE_BACKGROUND}
            style={styles.sceneImage}
            resizeMode="cover"
            accessibilityLabel="Escena de Home proporcionada por el operador"
          />
          <View style={styles.hotspotLayer} accessibilityLabel="Acciones visibles del Inicio de VEXFORGE">
            {HOTSPOTS.map((hotspot) => (
              <Pressable
                key={hotspot.id}
                accessibilityRole="button"
                accessibilityLabel={hotspot.label}
                accessibilityHint="Toca para abrir esta sección."
                hitSlop={8}
                testID={`home-reference-${hotspot.id}`}
                onPressIn={(event) => handlePressIn(event, hotspot)}
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
          {tapMarker ? (
            <View pointerEvents="none" style={[styles.tapMarker, { left: tapMarker.x - 32, top: tapMarker.y - 32 }]} testID="home-tap-ripple">
              <Animated.View style={[styles.tapRipple, { borderColor: tapMarker.color }, rippleStyle]} />
              <View style={[styles.tapCore, { backgroundColor: tapMarker.color }]} />
            </View>
          ) : null}
        </Animated.View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scene: { overflow: 'hidden' },
  sceneImage: { width: '100%', height: '100%' },
  hotspotLayer: { ...StyleSheet.absoluteFillObject },
  hotspot: { position: 'absolute', borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' },
  tapMarker: { position: 'absolute', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  tapRipple: { position: 'absolute', width: 58, height: 58, borderWidth: 2, borderRadius: 29, shadowColor: '#FFF5D5', shadowOpacity: 0.9, shadowRadius: 10, elevation: 8 },
  tapCore: { width: 8, height: 8, borderRadius: 4, opacity: 0.95 },
});
