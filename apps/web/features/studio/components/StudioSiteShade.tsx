'use client';
import type { ShadeCut } from '@heliogrid/data/react/studio';
import type { HeightGrid, SiteLineUp } from '@heliogrid/domain';
import { useEffect, useMemo } from 'react';
import { DoubleSide, type WebGLProgramParametersWithUniforms } from 'three';
import { siteCatcherGeometry, siteShadeGeometry } from './site-shade-geometry';

/** The shadow catcher's reach each way from the pin, and its lift over the picture. */
const CATCHER_REACH_M = 120;
const CATCHER_LIFT_M = 0.04;
/** The lift as the catcher's shader writes it: a float, never an integer. */
const CATCHER_LIFT_GLSL = CATCHER_LIFT_M.toFixed(2);
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
 * Draws the catcher flat on the picture while its shadows are tested where it stands: the picture
 * is a view straight down, so a top it shows sits under the shade that falls on that top.
 */
function flatOnPicture(shader: WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader.replace(
    '#include <project_vertex>',
    `#include <project_vertex>
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed.x, ${CATCHER_LIFT_GLSL}, transformed.z, 1.0);`,
  );
}

/**
 * The see-through catcher over the picture (`T-M05-002`, part g), which draws only shade — the
 * photo takes no light of its own. It stands at the height map's heights, so a neighbour's top on
 * the picture is never darkened by its own building standing over it; past the map, the ground.
 */
function Catcher({ grids, lineUp }: { grids: readonly HeightGrid[]; lineUp: SiteLineUp }) {
  const geometry = useMemo(
    () => siteCatcherGeometry(grids, lineUp, CATCHER_REACH_M),
    [grids, lineUp],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow frustumCulled={false}>
      <shadowMaterial transparent opacity={SHADE_STRENGTH} onBeforeCompile={flatOnPicture} />
    </mesh>
  );
}

/**
 * The whole site's shadows while the sun is shown (`T-M05-002`, part g, board G9): the height
 * map's casters, and the catcher that draws their shade and the model's on the picture.
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
      <Catcher grids={grids} lineUp={lineUp} />
    </>
  );
}
