import { type ShadeCut, shadeCasterOf } from '@heliogrid/data/react/studio';
import type { HeightGrid, SiteLineUp } from '@heliogrid/domain';
import { BufferAttribute, BufferGeometry } from 'three';

const XYZ = 3;

/**
 * The height map as a shadow caster (`T-M05-002`, part g): the cells `shadeCasterOf` keeps, as one
 * mesh the scene casts from and never draws.
 */
export function siteShadeGeometry(
  grid: HeightGrid,
  cuts: readonly ShadeCut[],
  lineUp: SiteLineUp,
): BufferGeometry {
  const made = new BufferGeometry();
  made.setAttribute('position', new BufferAttribute(shadeCasterOf(grid, cuts, lineUp), XYZ));
  return made;
}
