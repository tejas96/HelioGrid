'use client';
import type { HeightGrid } from '@heliogrid/domain';
import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { heightSurfaceGeometry, type SurfaceLook } from './height-surface-geometry';

/**
 * The height view on the model (`T-M05-002`, part g, board G7 and G7t): Google's height map as
 * one see-through surface, coloured low to high by the key, under the roofs. It shows in full near
 * the roofs and fades out farther off, so the neighbours never hide the roof; a steep cell — a
 * wall in the map — fades, so the tops read. Flat in the top view: colours on the picture, over
 * the roofs' tops too, which wear the picture there (board G7t). One mesh, one draw call, built
 * only while the view is on.
 */
export function StudioHeightSurface({
  grid,
  opacity,
  ...look
}: SurfaceLook & {
  grid: HeightGrid;
  /** How much of the map shows, 0 to 1. */
  opacity: number;
}) {
  const { flat, span, fadeEdge, skip, colours, lowM, highM, near, lineUp } = look;
  const geometry = useMemo(
    () =>
      heightSurfaceGeometry(grid, {
        flat,
        span,
        fadeEdge,
        skip,
        colours,
        lowM,
        highM,
        near,
        lineUp,
      }),
    [grid, flat, span, fadeEdge, skip, colours, lowM, highM, near, lineUp],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} renderOrder={flat ? 1 : 0}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={!flat}
        toneMapped={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
