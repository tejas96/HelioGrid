'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import type { Coordinate, Roof, RoofSunlight, SkylineAngles } from '@heliogrid/domain';
import { useEffect, useState } from 'react';

/** Each roof's sunlight worked out off the page's thread where the host has a worker. */
export type SiteSunlightReader = (input: {
  readonly areas: SiteDataWire['areas'];
  readonly buildings: SiteDataWire['buildings'];
  readonly roofs: readonly Pick<Roof, 'id' | 'corners'>[];
  readonly far: SkylineAngles | null;
  readonly place: Coordinate;
  readonly year: number;
}) => Promise<Record<string, RoofSunlight>>;

/**
 * Sunlight on the roofs while the height view shows it (`T-M05-002`, part g, board G24): asked
 * again when the roofs change; an answer to an older ask is dropped. `null` until it comes.
 */
export function useSiteSunlight(input: {
  readonly on: boolean;
  readonly data: SiteDataWire | null;
  /** The roofs' shapes, the same object while no corner moves. */
  readonly roofs: readonly Pick<Roof, 'id' | 'corners'>[];
  readonly pin: Coordinate | null;
  readonly reader: SiteSunlightReader;
}): Record<string, RoofSunlight> | null {
  const [sunlight, setSunlight] = useState<Record<string, RoofSunlight> | null>(null);
  const { on, data, roofs, pin, reader } = input;
  useEffect(() => {
    if (!on || data === null || pin === null) return;
    let live = true;
    void reader({
      areas: data.areas,
      buildings: data.buildings,
      roofs,
      far: data.farHorizon,
      place: pin,
      year: new Date().getUTCFullYear(),
    }).then((answer) => {
      if (live) setSunlight(answer);
    });
    return () => {
      live = false;
    };
  }, [on, data, roofs, pin, reader]);
  return on ? sunlight : null;
}
