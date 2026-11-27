import type { SiteDataWire, StudioDocumentWire } from '@heliogrid/contracts';
import { IN_FORMATS } from '@heliogrid/domain';
import { gridToWire } from '@heliogrid/domain/studio-kernel';
import { waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { expect } from 'vitest';
import {
  readSiteInPlace,
  SiteReaderProvider,
  type SiteReaders,
} from '../../src/react/site-readers';
import { useStudioScreen } from '../../src/react/use-studio-screen';
import { stored } from './studio-document-origin';
import {
  aDesign,
  DESIGNS_ROLE,
  designId,
  mountedOver,
  origin,
  READS_ONLY_ROLE,
} from './studio-origin';

/** LiDAR's test site: a roof traced off a 9 m block the scan sees, and the studio opened on it. */

export const box = (west: number, south: number, east: number, north: number) => [
  { east: west, north: south },
  { east, north: south },
  { east, north },
  { east: west, north },
];
/** A roof traced 3 m west and 2 m south of where the scan sees its building. */
export const TRACED: StudioDocumentWire['roofs'][number] = {
  id: '01a50000-0000-7000-8000-000000000911',
  corners: box(0, 0, 10, 8),
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: { metres: 4, setBy: 'person' },
};
const BUILDING = box(3, 2, 13, 10);

/** The scan: a 9 m block on flat ground, a quarter metre a cell, 60 m round the pin. */
export function scanned(): SiteDataWire {
  const size = 60;
  const stepM = 0.25;
  const cols = size / stepM;
  const heights = new Float32Array(cols * cols);
  for (let row = 0; row < cols; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const east = -30 + (col + 0.5) * stepM;
      const north = -30 + (row + 0.5) * stepM;
      heights[row * cols + col] = east > 3 && east < 13 && north > 2 && north < 10 ? 9 : 0;
    }
  }
  const grid = gridToWire({ west: -30, south: -30, stepM, cols, rows: cols, heights });
  return {
    source: 'google_solar',
    quality: 'base',
    dataOn: '2025-10-17',
    areas: [{ grid, surround: grid }],
    buildings: [{ outline: BUILDING, groundM: 0, heightM: null, floorsAbove: null }],
    eaves: [],
    faces: [],
    straightDown: null,
    farHorizon: null,
    timeZone: 'Asia/Kolkata',
    credits: ['google_solar'],
    gaps: [],
  };
}

export async function opened(
  editor = true,
  data: SiteDataWire | null = scanned(),
  readers: SiteReaders = readSiteInPlace,
  roof: StudioDocumentWire['roofs'][number] = TRACED,
) {
  origin.designs = [aDesign(1)];
  origin.roles = [editor ? DESIGNS_ROLE : READS_ONLY_ROLE];
  stored.siteData = data;
  stored.document = {
    ...stored.document,
    drawnOn: { source: 'google', takenOn: null },
    roofs: [roof],
  };
  const view = mountedOver(
    () => useStudioScreen(designId(1), IN_FORMATS),
    undefined,
    (children) => createElement(SiteReaderProvider, { value: readers }, children),
  );
  await waitFor(() => expect(view.result.current.document?.roofs).toHaveLength(1));
  if (editor) await waitFor(() => expect(view.result.current.editing.kind).toBe('editor'));
  await waitFor(() => expect(view.result.current.site.read.kind).not.toBe('loading'));
  return view;
}
