/// <reference lib="webworker" />

import type {
  DrawnOnPiece,
  SiteFitReader,
  SiteLineUpReader,
  SiteRoofReader,
  SiteScanReader,
  SiteSunlightReader,
} from '@heliogrid/data/react/studio';
import {
  automaticLineUpOf,
  type PicturePixels,
  roofDataReadsOf,
  roofsSunlightOf,
  scanFitsOf,
  scanMeshOf,
  siteGridsOf,
} from '@heliogrid/domain/studio-kernel';

/**
 * The site's reads off the page's thread (`T-M05-002`, part g; `T-M05-002g`): each drawn roof on
 * the height map, so a campus of thirty roofs never stalls a drag; each roof's sunlight, the
 * heaviest maths the studio does; where the scan sees each drawn building; the studio's own
 * line-up of the map; and the scan's mesh for LiDAR. Each ask carries its number; its answer the
 * same, with the mesh's lists handed over, never copied.
 */
type Ask =
  | { readonly id: number; readonly kind: 'roofs'; readonly input: Parameters<SiteRoofReader>[0] }
  | {
      readonly id: number;
      readonly kind: 'sunlight';
      readonly input: Parameters<SiteSunlightReader>[0];
    }
  | { readonly id: number; readonly kind: 'fits'; readonly input: Parameters<SiteFitReader>[0] }
  | {
      readonly id: number;
      readonly kind: 'line_up';
      readonly input: Parameters<SiteLineUpReader>[0];
    }
  | { readonly id: number; readonly kind: 'scan'; readonly input: Parameters<SiteScanReader>[0] };

/** A `data:` picture as the bytes it holds. */
function blobOf(image: string): Blob {
  const [head = '', body = ''] = image.split(',', 2);
  const type = head.slice('data:'.length).split(';')[0] ?? '';
  const bytes = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

/** A picture piece decoded to its pixels; `null` where it does not decode. */
async function pixelsOf(piece: DrawnOnPiece): Promise<PicturePixels | null> {
  try {
    const bitmap = await createImageBitmap(blobOf(piece.image));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (context === null) return null;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    const { west, south, east, north } = piece;
    return { rgba: data, width: bitmap.width, height: bitmap.height, west, south, east, north };
  } catch {
    return null;
  }
}

async function answerOf(ask: Ask): Promise<{ answer: unknown; moved: Transferable[] }> {
  switch (ask.kind) {
    case 'roofs': {
      const grids = siteGridsOf(ask.input.areas, ask.input.buildings);
      return { answer: roofDataReadsOf(ask.input.roofs, grids, ask.input.lineUp), moved: [] };
    }
    case 'sunlight': {
      const { roofs, far, place, year } = ask.input;
      const grids = siteGridsOf(ask.input.areas, ask.input.buildings);
      return { answer: roofsSunlightOf(grids, roofs, far, place, year), moved: [] };
    }
    case 'fits': {
      const { areas, buildings, drawn, lineUp } = ask.input;
      const grids = siteGridsOf(areas, buildings);
      const outlines = buildings.map((building) => building.outline);
      return { answer: scanFitsOf({ buildings: drawn, outlines, grids, lineUp }), moved: [] };
    }
    case 'line_up': {
      const decoded = await Promise.all(ask.input.pieces.map(pixelsOf));
      const pieces = decoded.flatMap((one) => (one === null ? [] : [one]));
      const { straightDown, scale } = ask.input;
      return { answer: automaticLineUpOf(pieces, straightDown, scale), moved: [] };
    }
    case 'scan': {
      const mesh = scanMeshOf(ask.input);
      return {
        answer: mesh,
        moved: [mesh.positions.buffer, mesh.normals.buffer, mesh.indices.buffer],
      };
    }
  }
}

self.onmessage = (message: MessageEvent<Ask>) => {
  const ask = message.data;
  // An ask whose maths throws is answered as failed, so its lane answers it empty, never leaves it.
  void answerOf(ask).then(
    ({ answer, moved }) => self.postMessage({ id: ask.id, answer }, { transfer: moved }),
    () => self.postMessage({ id: ask.id, failed: true }),
  );
};
