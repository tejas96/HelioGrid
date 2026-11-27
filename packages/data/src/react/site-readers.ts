'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import type { HeightGrid, Roof, RoofDataRead, SiteLineUp } from '@heliogrid/domain';
import {
  type BuildingScanFit,
  roofDataReadsOf,
  roofsSunlightOf,
  scanFitsOf,
  scanMeshOf,
  siteGridsOf,
} from '@heliogrid/domain/studio-kernel';
import { createContext } from 'react';
import type { LidarMesh } from './lidar-view';
import type { GroundSpan } from './site-layer';
import type { SiteSunlightReader } from './use-site-sunlight';

/** What reads each roof on the site data: the web's Web Worker, or the kernel in place. */
export type SiteRoofReader = (input: {
  readonly areas: SiteDataWire['areas'];
  readonly buildings: SiteDataWire['buildings'];
  readonly roofs: readonly Pick<Roof, 'id' | 'corners'>[];
  readonly lineUp?: SiteLineUp;
}) => Promise<Record<string, RoofDataRead>>;

/** The kernel in place: for a host with no worker. */
export const readRoofsInPlace: SiteRoofReader = async (input) =>
  roofDataReadsOf(input.roofs, siteGridsOf(input.areas, input.buildings), input.lineUp);

type RoofShape = Pick<Roof, 'id' | 'corners'>;

/** Where the scan sees each drawn building (`T-M05-002g`): its shift, and its roofs' reads there. */
export type SiteFitReader = (input: {
  readonly areas: SiteDataWire['areas'];
  readonly buildings: SiteDataWire['buildings'];
  /** Each drawn building: its roofs on the ground, and every roof that moves with it. */
  readonly drawn: readonly {
    readonly ground: readonly RoofShape[];
    readonly members: readonly RoofShape[];
  }[];
  readonly lineUp: SiteLineUp;
}) => Promise<readonly BuildingScanFit[]>;

/** A piece of the picture the roofs were drawn on, as the page holds it. */
export interface DrawnOnPiece {
  readonly image: string;
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/**
 * The studio's own line-up of the height map (`T-M05-002g`, step 1): the straight-down picture
 * matched to the picture the roofs were drawn on. It decodes pictures, which a host with no worker
 * cannot: there it answers `null`, and the map stays where the data laid it.
 */
export type SiteLineUpReader = (input: {
  readonly pieces: readonly DrawnOnPiece[];
  readonly straightDown: NonNullable<SiteDataWire['straightDown']>;
  /** How much the picture is stretched about the pin by the first true length. */
  readonly scale: number;
}) => Promise<SiteLineUp | null>;

/** LiDAR's scan as one mesh from the site's grids (`T-M05-002g`); `null` where it was not built. */
export type SiteScanReader = (
  layers: readonly { readonly grid: HeightGrid; readonly skip: GroundSpan | null }[],
) => Promise<LidarMesh | null>;

/**
 * The site's readers: each drawn roof on the height map, the roofs' sunlight, the scan's fits,
 * the studio's own line-up and the scan's mesh.
 */
export interface SiteReaders {
  readonly roofs: SiteRoofReader;
  readonly sunlight: SiteSunlightReader;
  readonly fits: SiteFitReader;
  readonly lineUp: SiteLineUpReader;
  readonly scan: SiteScanReader;
}

/** The kernel in place, for a host with no worker. */
export const readSiteInPlace: SiteReaders = {
  roofs: readRoofsInPlace,
  sunlight: async (input) =>
    roofsSunlightOf(
      siteGridsOf(input.areas, input.buildings),
      input.roofs,
      input.far,
      input.place,
      input.year,
    ),
  fits: async (input) =>
    scanFitsOf({
      buildings: input.drawn,
      outlines: input.buildings.map((building) => building.outline),
      grids: siteGridsOf(input.areas, input.buildings),
      lineUp: input.lineUp,
    }),
  lineUp: async () => null,
  scan: async (layers) => scanMeshOf(layers),
};

export const SiteReaderContext = createContext<SiteReaders>(readSiteInPlace);

/** Where a host hands the studio its reader of roofs: the web, its Web Worker. */
export const SiteReaderProvider = SiteReaderContext.Provider;
