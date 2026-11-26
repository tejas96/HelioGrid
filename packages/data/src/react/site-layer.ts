import type { HeightGrid } from '@heliogrid/domain';

/** A box of ground, in metres east and north of the pin. */
export interface GroundSpan {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/**
 * One grid the height view draws (`T-M05-002`, part g): an area's sharp grid round its roofs, or
 * its metre grid round that out to the data's edge, which leaves out what the sharp one covers.
 */
export interface HeightLayer {
  readonly grid: HeightGrid;
  /** The ground the grid covers. */
  readonly span: GroundSpan;
  /** Fades to nothing at its own edge; a sharp grid with its metre grid round it meets it instead. */
  readonly fadeEdge: boolean;
  /** Ground this layer leaves to another; `null` when it draws all of its grid. */
  readonly skip: GroundSpan | null;
}
