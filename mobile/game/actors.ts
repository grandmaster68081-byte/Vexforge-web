import type { ActorMotion } from './types';

export interface ActorRigProfile {
  bodyTiltDegrees: number;
  bodyLift: number;
  leftArmDegrees: number;
  rightArmDegrees: number;
  weaponDegrees: number;
  cloakDegrees: number;
  opacity: number;
}

export const ACTOR_RIG_PROFILES: Record<ActorMotion, ActorRigProfile> = {
  idle: {
    bodyTiltDegrees: 0,
    bodyLift: 2,
    leftArmDegrees: -4,
    rightArmDegrees: 4,
    weaponDegrees: 0,
    cloakDegrees: 3,
    opacity: 1,
  },
  anticipation: {
    bodyTiltDegrees: -11,
    bodyLift: -2,
    leftArmDegrees: -28,
    rightArmDegrees: 24,
    weaponDegrees: 18,
    cloakDegrees: 12,
    opacity: 1,
  },
  attacking: {
    bodyTiltDegrees: 10,
    bodyLift: 1,
    leftArmDegrees: 24,
    rightArmDegrees: -48,
    weaponDegrees: -58,
    cloakDegrees: -16,
    opacity: 1,
  },
  'taking-hit': {
    bodyTiltDegrees: -13,
    bodyLift: 0,
    leftArmDegrees: -24,
    rightArmDegrees: 38,
    weaponDegrees: 26,
    cloakDegrees: -18,
    opacity: 1,
  },
  casting: {
    bodyTiltDegrees: -4,
    bodyLift: -8,
    leftArmDegrees: -42,
    rightArmDegrees: -52,
    weaponDegrees: -22,
    cloakDegrees: 16,
    opacity: 1,
  },
  guarding: {
    bodyTiltDegrees: -5,
    bodyLift: 0,
    leftArmDegrees: -38,
    rightArmDegrees: -18,
    weaponDegrees: 12,
    cloakDegrees: 5,
    opacity: 1,
  },
  staggered: {
    bodyTiltDegrees: 16,
    bodyLift: -1,
    leftArmDegrees: -32,
    rightArmDegrees: 36,
    weaponDegrees: 42,
    cloakDegrees: -26,
    opacity: 0.9,
  },
  status: {
    bodyTiltDegrees: 2,
    bodyLift: 1,
    leftArmDegrees: -8,
    rightArmDegrees: 8,
    weaponDegrees: 0,
    cloakDegrees: 11,
    opacity: 0.94,
  },
  healing: {
    bodyTiltDegrees: -2,
    bodyLift: -5,
    leftArmDegrees: -18,
    rightArmDegrees: -24,
    weaponDegrees: 0,
    cloakDegrees: 10,
    opacity: 1,
  },
  defeated: {
    bodyTiltDegrees: 68,
    bodyLift: 7,
    leftArmDegrees: 38,
    rightArmDegrees: -34,
    weaponDegrees: 56,
    cloakDegrees: 25,
    opacity: 0.3,
  },
  victory: {
    bodyTiltDegrees: -3,
    bodyLift: -8,
    leftArmDegrees: -62,
    rightArmDegrees: -68,
    weaponDegrees: -28,
    cloakDegrees: 18,
    opacity: 1,
  },
  summoning: {
    bodyTiltDegrees: 0,
    bodyLift: -14,
    leftArmDegrees: -44,
    rightArmDegrees: -44,
    weaponDegrees: 0,
    cloakDegrees: 22,
    opacity: 0.82,
  },
  phase: {
    bodyTiltDegrees: 4,
    bodyLift: -4,
    leftArmDegrees: -22,
    rightArmDegrees: -32,
    weaponDegrees: 20,
    cloakDegrees: 28,
    opacity: 1,
  },
  revealing: {
    bodyTiltDegrees: 0,
    bodyLift: -10,
    leftArmDegrees: -20,
    rightArmDegrees: -20,
    weaponDegrees: 0,
    cloakDegrees: 16,
    opacity: 1,
  },
};

export function actorRigProfile(motion: ActorMotion): ActorRigProfile {
  return ACTOR_RIG_PROFILES[motion];
}