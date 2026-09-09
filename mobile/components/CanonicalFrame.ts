export const CANONICAL_FRAME_WIDTH = 1080;
export const CANONICAL_FRAME_HEIGHT = 2340;
export const CANONICAL_FRAME_ASPECT_RATIO = CANONICAL_FRAME_WIDTH / CANONICAL_FRAME_HEIGHT;

export type CanonicalFrameMetrics = {
  width: number;
  height: number;
  scale: number;
};

/**
 * Fits the authored 1080×2340 composition inside the available viewport
 * without changing its aspect ratio. Reference artwork and its percentage
 * based hit map must always use these same frame dimensions.
 */
export function getCanonicalFrameMetrics(viewportWidth: number, viewportHeight: number): CanonicalFrameMetrics {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const scale = Math.min(
    safeWidth / CANONICAL_FRAME_WIDTH,
    safeHeight / CANONICAL_FRAME_HEIGHT,
  );

  return {
    width: CANONICAL_FRAME_WIDTH * scale,
    height: CANONICAL_FRAME_HEIGHT * scale,
    scale,
  };
}