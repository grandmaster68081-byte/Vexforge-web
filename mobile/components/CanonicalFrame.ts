import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

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

/**
 * Uses the measured native container as the source of truth for screens that
 * are mounted inside scrollable or tab content. Some Android builds report
 * window dimensions in a different coordinate space from the actual layout;
 * using that value directly can render a 1080×2340 asset at native size and
 * show only a cropped portion of it.
 */
export function useMeasuredCanonicalFrame(
  viewportWidth: number,
  viewportHeight: number,
  topInset = 0,
  bottomInset = 0,
): CanonicalFrameMetrics & { onLayout: (event: LayoutChangeEvent) => void } {
  const fallback = getCanonicalFrameMetrics(
    viewportWidth,
    Math.max(1, viewportHeight - topInset - bottomInset),
  );
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setContainer((current) => (
      current.width === width && current.height === height
        ? current
        : { width, height }
    ));
  }, []);

  if (container.width <= 0 || container.height <= 0) {
    return { ...fallback, onLayout };
  }

  // Android can report window dimensions in physical pixels while native
  // layout events are expressed in dp. Fit from the measured container so
  // the authored frame cannot be mounted at the wrong coordinate scale.
  return {
    ...getCanonicalFrameMetrics(
      container.width,
      Math.max(1, container.height - topInset),
    ),
    onLayout,
  };
}
