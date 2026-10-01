export const SCENE_LAYER_IDS = [
  'BACK',
  'MID',
  'PLAYFIELD',
  'ACTORS',
  'FRONT_FX',
  'HUD',
] as const;

export type SceneLayerId = (typeof SCENE_LAYER_IDS)[number];
export type SceneLayerVisibility = Record<SceneLayerId, boolean>;

export const DEFAULT_SCENE_LAYER_VISIBILITY: SceneLayerVisibility = {
  BACK: true,
  MID: true,
  PLAYFIELD: true,
  ACTORS: true,
  FRONT_FX: true,
  HUD: true,
};

export const SCENE_LAYER_LABELS: Record<SceneLayerId, string> = {
  BACK: 'FONDO',
  MID: 'MEDIO',
  PLAYFIELD: 'CAMPO',
  ACTORS: 'ACTORES',
  FRONT_FX: 'VFX',
  HUD: 'HUD',
};

export function isSceneLayerVisible(
  visibility: Partial<SceneLayerVisibility> | undefined,
  layer: SceneLayerId,
): boolean {
  return visibility?.[layer] ?? true;
}