'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import type { Roof, RoofDataRead, SiteLineUp } from '@heliogrid/domain';
import { roofDataReadsOf, roofsSunlightOf, siteGridsOf } from '@heliogrid/domain/studio-kernel';
import { createContext } from 'react';
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

/** The site's readers: each drawn roof on the height map, and the roofs' sunlight. */
export interface SiteReaders {
  readonly roofs: SiteRoofReader;
  readonly sunlight: SiteSunlightReader;
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
};

export const SiteReaderContext = createContext<SiteReaders>(readSiteInPlace);

/** Where a host hands the studio its reader of roofs: the web, its Web Worker. */
export const SiteReaderProvider = SiteReaderContext.Provider;
