import {
  Easing,
  type SharedValue,
  withTiming,
} from 'react-native-reanimated';

export const GAME_MOTION = {
  sceneEntrance: 420,
  feedback: 180,
} as const;

export function animateSceneEntrance(progress: SharedValue<number>, reduceMotion: boolean) {
  progress.value = withTiming(1, {
    duration: reduceMotion ? 0 : GAME_MOTION.sceneEntrance,
    easing: Easing.out(Easing.cubic),
  });
}

export function animateFeedback(progress: SharedValue<number>, reduceMotion: boolean) {
  progress.value = withTiming(1, {
    duration: reduceMotion ? 0 : GAME_MOTION.feedback,
    easing: Easing.out(Easing.quad),
  });
}

export function resetMotion(progress: SharedValue<number>) {
  progress.value = 0;
}