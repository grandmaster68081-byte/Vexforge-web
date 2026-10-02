import { VexforgeImage } from '../render/VexforgeImage';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AmbientSigil, StatusPill, WorldObject } from '../render/Diegetic';
import { COLORS } from '../core/constants';

const BOSS_SIGIL = require('../../assets/vexforge/VF_BOSS_SIGIL.png');
const BOSS_AURA = require('../../assets/vexforge/VF_BOSS_AURA.png');

export function BossMonument({ boss, onPress }: { boss: any; onPress?: () => void }) {
  const pulse = useSharedValue(0.96);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <WorldObject accent={COLORS.crimson} onPress={onPress} style={styles.wrap}>
      <Animated.View style={[styles.aura, style]}>
        <View style={styles.sig}>
          <AmbientSigil accent={COLORS.crimson} />
          <VexforgeImage source={BOSS_SIGIL} resizeMode="contain" style={styles.sigilAsset} />
        </View>
      </Animated.View>
      {boss?.image_url ? (
        <VexforgeImage source={{ uri: boss.image_url }} resizeMode="cover" style={styles.image} />
      ) : (
        <VexforgeImage source={BOSS_AURA} resizeMode="cover" style={styles.image} />
      )}
      <View style={styles.info}>
        <StatusPill label={`TIER ${boss?.tier ?? '—'}`} accent={COLORS.crimson} />
        <Text style={styles.name}>{boss?.name ?? boss?.boss_code ?? 'WORLD BOSS'}</Text>
        <Text style={styles.meta}>
          POWER {boss?.power_level ?? '—'} · HP {boss?.hp ?? '—'} · {boss?.region_id ?? 'REGIÓN'}
        </Text>
        <Text style={styles.body}>
          El encuentro conserva identidad narrativa, estado y settlement en el servidor.
        </Text>
      </View>
    </WorldObject>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'hidden', minHeight: 150, padding: 10, flexDirection: 'row', gap: 10 },
  aura: { position: 'absolute', right: -40, top: -42, width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: `${COLORS.crimson}36`, backgroundColor: `${COLORS.crimson}08`, alignItems: 'center', justifyContent: 'center' },
  sig: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: `${COLORS.crimson}22`, alignItems: 'center', justifyContent: 'center' },
  sigilAsset: { position: 'absolute', width: 60, height: 60, opacity: 0.88 },
  image: { width: 105, height: 125, borderRadius: 17, borderWidth: 1, borderColor: `${COLORS.crimson}46`, backgroundColor: COLORS.crimsonDeep },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontFamily: 'Cinzel_700Bold', color: COLORS.white, fontSize: 13, marginTop: 5 },
  meta: { color: COLORS.goldDim, fontSize: 6.5, fontWeight: '900', marginTop: 3 },
  body: { color: COLORS.parchment, fontSize: 8, lineHeight: 12, marginTop: 6 },
});
