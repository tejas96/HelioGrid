'use client';
import type { ShadeCut } from '@heliogrid/data/react/studio';
import type { HeightGrid, SiteLineUp } from '@heliogrid/domain';
import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { siteShadeGeometry } from './site-shade-geometry';

/** The shadow catcher's reach about the site, and its lift over the picture. */
const CATCHER_M = 240;
const CATCHER_LIFT_M = 0.03;
/** How dark a shadow falls on the picture, which holds its own light already. */
const SHADE_STRENGTH = 0.32;

/** One sharp grid cast into the scene's shadows, never drawn. */
function Caster({
  grid,
  cuts,
  lineUp,
}: {
  grid: HeightGrid;
  cuts: readonly ShadeCut[];
  lineUp: SiteLineUp;
}) {
  const geometry = useMemo(() => siteShadeGeometry(grid, cuts, lineUp), [grid, cuts, lineUp]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow>
      <meshBasicMaterial colorWrite={false} depthWrite={false} side={DoubleSide} />
    </mesh>
  );
}

/**
 * The whole site's shadows while the sun is shown (`T-M05-002`, part g, board G9): the height
 * map's casters, and a see-through catcher over the picture, which draws only shade — the photo
 * takes no light of its own.
 */
export function StudioSiteShade({
  grids,
  cuts,
  lineUp,
}: {
  grids: readonly HeightGrid[];
  /** The drawn roofs: the model casts their shadows. */
  cuts: readonly ShadeCut[];
  /** Where the person lined the map up: its shadows fall from there. */
  lineUp: SiteLineUp;
}) {
  return (
    <>
      {grids.map((grid, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the site's areas keep their order
        <Caster key={index} grid={grid} cuts={cuts} lineUp={lineUp} />
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={CATCHER_LIFT_M} receiveShadow>
        <planeGeometry args={[CATCHER_M, CATCHER_M]} />
        <shadowMaterial transparent opacity={SHADE_STRENGTH} />
      </mesh>
    </>
  );
}
