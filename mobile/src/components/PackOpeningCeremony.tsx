import { VexforgeImage, AnimatedVexforgeImage } from '../render/VexforgeImage';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useAudioPlayer } from 'expo-audio';
import { VexforgeCard } from './VexforgeCard';
import { COLORS, SCENE_ART_TIER, CINEMATIC_ART } from '../core/constants';
import { useGame } from '../app/GameProvider';
import { packCardRevealCue, packCueForStage } from '../../game/packTimeline';

const RELIC = require('../../assets/vexforge/VF_PACK_RELIC.png');
const SIGIL = require('../../assets/vexforge/VF_REWARD_SIGIL_PREMIUM.png');
const COMMON_SIGIL = require('../../assets/vexforge/VF_REWARD_SIGIL_COMMON.png');
const REVEAL_AUDIO = require('../../assets/vexforge/pack_reveal.wav');
const REWARD_AUDIO = require('../../assets/vexforge/reward.wav');

export function PackOpeningCeremony({ visible, packName, cards, onClose }: { visible: boolean; packName?: string; cards: any[]; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const { quality, haptic } = useGame();
  const [stage, setStage] = useState<'awakening'|'binding'|'reveal'|'complete'>('awakening');
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const camera = useSharedValue(1.03);
  const relicScale = useSharedValue(.72);
  const relicGlow = useSharedValue(.26);
  const cardY = useSharedValue(70);
  const cardScale = useSharedValue(.84);
  const fade = useSharedValue(0);
  const flash = useSharedValue(0);
  const revealPlayer = useAudioPlayer(REVEAL_AUDIO);
  const rewardPlayer = useAudioPlayer(REWARD_AUDIO);

  useEffect(() => {
    if (!visible) return;
    setStage('awakening'); setIndex(0); setOpened(false);
    camera.value = 1.03; relicScale.value = .72; relicGlow.value = .26; cardY.value = 70; cardScale.value = .84; fade.value = 0; flash.value = 0;
    camera.value = withSequence(withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.quad) }), withTiming(1.04, { duration: 600 }));
    relicScale.value = withSequence(withTiming(1.08, { duration: 420, easing: Easing.out(Easing.cubic) }), withSpring(1, { damping: 11, stiffness: 140 }));
    relicGlow.value = withSequence(withTiming(1, { duration: 680 }), withTiming(.68, { duration: 600 }));
    flash.value = withSequence(withTiming(.42, { duration: 120 }), withTiming(0, { duration: 650 }));
    fade.value = withDelay(240, withTiming(1, { duration: 520 }));
    const openingCue = packCueForStage('awakening');
    if (openingCue.haptic !== 'none') void haptic(openingCue.haptic);
    const t1 = setTimeout(() => setStage('binding'), openingCue.durationMs);
    return () => clearTimeout(t1);
  }, [visible, camera, relicScale, relicGlow, cardY, cardScale, fade, flash, haptic]);

  useEffect(() => {
    const cue = packCueForStage(stage);
    camera.value = withTiming(cue.camera.zoom, { duration: cue.camera.durationMs, easing: Easing.out(Easing.cubic) });
  }, [stage, camera]);

  useEffect(() => {
    if (stage !== 'binding') return;
    const cue = packCueForStage('binding');
    if (cue.haptic !== 'none') void haptic(cue.haptic);
    if (cue.audio === 'reveal') { try { void revealPlayer.seekTo(0); revealPlayer.play(); } catch { /* optional audio */ } }
    const t = setTimeout(() => setStage(cards.length ? 'reveal' : 'complete'), cue.durationMs);
    return () => clearTimeout(t);
  }, [stage, cards.length, revealPlayer, haptic]);

  useEffect(() => {
    if (stage === 'complete') {
      const cue = packCueForStage('complete');
      if (cue.haptic !== 'none') void haptic(cue.haptic);
      if (cue.audio === 'reward') { try { void rewardPlayer.seekTo(0); rewardPlayer.play(); } catch { /* optional audio */ } }
    }
  }, [stage, rewardPlayer, haptic]);

  const card = cards[index];
  const stageCue = packCueForStage(stage);
  const cameraStyle = useAnimatedStyle(() => ({ transform: [{ scale: camera.value }] }));
  const relicStyle = useAnimatedStyle(() => ({ transform: [{ scale: relicScale.value }], opacity: .76 + relicGlow.value * .24, shadowOpacity: .22 + relicGlow.value * .45 }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: cardY.value }, { scale: cardScale.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const title = stage === 'awakening' ? 'EL SELLO DESPIERTA' : stage === 'binding' ? 'VINCULACIÓN DE PROPIEDAD' : stage === 'complete' ? 'ADQUISICIÓN CONSUMADA' : 'REVELACIÓN DE IDENTIDADES';
  const subtitle = stage === 'awakening'
    ? 'El Vault reconoce el paquete como una puerta. El ritual prepara la entidad.'
    : stage === 'binding'
      ? 'La propiedad se registra en el flujo autorizado. La autoridad económica permanece en el servidor.'
      : stage === 'complete'
        ? 'Las identidades han sido añadidas a tu colección oficial.'
        : 'Una identidad aguarda detrás del sello. Cada revelación es irreversible.';

  const revealCurrent = () => {
    if (!stageCue.interactive || stage !== 'reveal' || !card) return;
    const cue = packCardRevealCue(index, cards.length);
    if (cue.haptic !== 'none') void haptic(cue.haptic);
    if (cue.audio === 'reveal') { try { void revealPlayer.seekTo(0); revealPlayer.play(); } catch { /* optional audio */ } }
    setOpened(true);
    flash.value = withSequence(withTiming(.35, { duration: 80 }), withTiming(0, { duration: 320 }));
    cardY.value = withSequence(withTiming(-12, { duration: 150 }), withSpring(0, { damping: 12, stiffness: 160 }));
    cardScale.value = withSequence(withTiming(1.045, { duration: 160 }), withSpring(1, { damping: 12 }));
  };

  const next = () => {
    if (!stageCue.interactive || !opened) return;
    if (index >= cards.length - 1) { setStage('complete'); return; }
    setOpened(false); setIndex(i => i + 1);
    cardY.value = 62; cardScale.value = .86; fade.value = 0;
    fade.value = withDelay(70, withTiming(1, { duration: 280 }));
    const cue = packCardRevealCue(index + 1, cards.length);
    if (cue.haptic !== 'none') void haptic(cue.haptic);
    if (cue.audio === 'reveal') { try { void revealPlayer.seekTo(0); revealPlayer.play(); } catch { /* optional audio */ } }
  };

  const close = () => { setStage('complete'); onClose(); };
  const cardWidth = Math.min(250, width * .58);
  const cardLeft = (width - cardWidth) / 2;
  const particleDots = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: (i * 71) % 100, y: (i * 43 + 5) % 100, r: 1 + (i % 3) })), []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.root}>
        <AnimatedVexforgeImage source={CINEMATIC_ART.pack_reveal} cacheMode="memory-disk" resizeMode="cover" style={[StyleSheet.absoluteFillObject, cameraStyle]} />
        <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={['rgba(0,0,4,.22)', 'rgba(3,2,7,.34)', 'rgba(0,0,3,.88)']} />
          </Rect>
          <Circle cx={width * .5} cy={height * .47} r={Math.min(width, height) * .34} color={COLORS.goldBright} opacity={.05} />
          {particleDots.map((p, i) => <Circle key={i} cx={width * p.x / 100} cy={height * p.y / 100} r={p.r} color={i % 2 ? COLORS.goldBright : COLORS.arcaneBright} opacity={.11 - (i % 5) * .013} />)}
        </Canvas>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.flash, flashStyle]} />

        <View style={styles.header}>
          <Text style={styles.kicker}>VAULT · ADQUISICIÓN OFICIAL · {quality}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Animated.View style={[styles.relicStage, relicStyle, { shadowColor: COLORS.goldBright }]}>
          <VexforgeImage source={stage === 'complete' ? (String(card?.rarity ?? '').toLowerCase() === 'common' ? COMMON_SIGIL : SIGIL) : RELIC} resizeMode="contain" style={styles.relic} />
          {stage !== 'reveal' && stage !== 'complete' ? <Text style={styles.packName}>{packName ?? 'PACK'} · {stage.toUpperCase()}</Text> : null}
        </Animated.View>

        {stage === 'reveal' && card ? (
          <Animated.View style={[styles.cardStage, cardStyle, { left: cardLeft, width: cardWidth }]}>
            <Pressable onPress={revealCurrent} style={styles.cardPress} accessibilityRole="button" accessibilityLabel="Revelar identidad">
              <VexforgeCard card={{ id: card.id ?? card.card_id, name: card.name, rarity: card.rarity, image_url: opened ? card.image_url : undefined, code: card.code }} width={cardWidth} hero faceDown={!opened} />
              {!opened ? <View style={styles.tapToReveal}><Text style={styles.tapK}>IDENTIDAD {index + 1} / {cards.length}</Text><Text style={styles.tapT}>TOCA PARA DESATAR</Text></View> : null}
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={styles.footer}>
          {stage === 'reveal' && opened ? (
            <>
              <Text style={styles.owned}>IDENTIDAD VINCULADA · {String(card?.rarity ?? 'UNVERIFIED').toUpperCase()}</Text>
              <Pressable onPress={next} style={[styles.button, { borderColor: `${COLORS.goldBright}99`, backgroundColor: `${COLORS.goldBright}17` }]}><Text style={styles.buttonText}>{index >= cards.length - 1 ? 'CERRAR EL VAULT' : 'REVELAR SIGUIENTE'}</Text></Pressable>
            </>
          ) : stage === 'complete' ? (
            <Pressable onPress={close} style={[styles.button, { borderColor: `${COLORS.mint}88`, backgroundColor: `${COLORS.mint}14` }]}><Text style={styles.buttonText}>VOLVER A LA CÁMARA</Text></Pressable>
          ) : (
            <Text style={styles.phase}>FASE {stage === 'awakening' ? 'I' : 'II'} · {stageCue.actor.toUpperCase()} · {stageCue.vfx.toUpperCase()}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#010106', overflow: 'hidden' },
  flash: { backgroundColor: 'rgba(255,242,201,.20)' },
  header: { position: 'absolute', top: 68, left: 22, right: 22, alignItems: 'center' },
  kicker: { color: COLORS.gold, fontSize: 6, fontWeight: '900', letterSpacing: 2.1, textAlign: 'center' },
  title: { color: COLORS.white, fontFamily: 'Cinzel_900Black', fontSize: 24, lineHeight: 28, textAlign: 'center', marginTop: 5 },
  subtitle: { color: COLORS.parchment, fontSize: 8.8, lineHeight: 13.5, textAlign: 'center', marginTop: 7, maxWidth: 350 },
  relicStage: { position: 'absolute', top: '23%', left: 0, right: 0, alignItems: 'center', shadowRadius: 44 },
  relic: { width: 190, height: 190 },
  packName: { color: COLORS.goldBright, fontSize: 7, fontWeight: '900', letterSpacing: 1.4, marginTop: 4 },
  cardStage: { position: 'absolute', top: '22%', alignItems: 'center' },
  cardPress: { alignItems: 'center' },
  tapToReveal: { position: 'absolute', bottom: 15, left: 12, right: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,.76)', borderRadius: 13, paddingVertical: 9, borderWidth: 1, borderColor: `${COLORS.gold}55` },
  tapK: { color: COLORS.goldDim, fontSize: 5.3, fontWeight: '900', letterSpacing: 1.2 },
  tapT: { color: COLORS.white, fontSize: 8, fontWeight: '900', marginTop: 3 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 42, alignItems: 'center' },
  phase: { color: COLORS.ash, fontSize: 6, fontWeight: '900', letterSpacing: 1.7, textAlign: 'center' },
  owned: { color: COLORS.mint, fontSize: 6.5, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center', marginBottom: 8 },
  button: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
});
