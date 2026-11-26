/// <reference lib="webworker" />

import type { SiteRoofReader, SiteSunlightReader } from '@heliogrid/data/react/studio';
import { roofDataReadsOf, roofsSunlightOf, siteGridsOf } from '@heliogrid/domain/studio-kernel';

/**
 * The site's reads off the page's thread (`T-M05-002`, part g): each drawn roof on the height
 * map, so a campus of thirty roofs never stalls a drag, and each roof's sunlight, the heaviest
 * maths the studio does. Each ask carries its number; its answer the same.
 */
type Ask =
  | { readonly id: number; readonly kind: 'roofs'; readonly input: Parameters<SiteRoofReader>[0] }
  | {
      readonly id: number;
      readonly kind: 'sunlight';
      readonly input: Parameters<SiteSunlightReader>[0];
    };

self.onmessage = (message: MessageEvent<Ask>) => {
  const ask = message.data;
  const grids = siteGridsOf(ask.input.areas, ask.input.buildings);
  if (ask.kind === 'roofs') {
    self.postMessage({
      id: ask.id,
      answer: roofDataReadsOf(ask.input.roofs, grids, ask.input.lineUp),
    });
    return;
  }
  const { roofs, far, place, year } = ask.input;
  self.postMessage({ id: ask.id, answer: roofsSunlightOf(grids, roofs, far, place, year) });
};
