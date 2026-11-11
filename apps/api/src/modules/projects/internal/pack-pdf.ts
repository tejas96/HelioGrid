import { PDFDocument } from 'pdf-lib';

/** One file of the pack, as the store holds it. */
export interface PackPart {
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

/** A4 in PDF points — the page a photo is set on. */
const A4 = { width: 595.28, height: 841.89 } as const;
/** The margin around a photo on its page. */
const MARGIN = 36;

/** The pack made: its bytes — null when no part gave a page — and how many parts were left out. */
export interface PackMade {
  readonly bytes: Uint8Array | null;
  readonly leftOut: number;
}

/**
 * The handover pack as one PDF (`M08-46`): each part in order — a PDF's own pages as they are, a
 * locked one included (a portal's approval often is), a photo on an A4 page of its own, scaled to
 * fit and never enlarged. A damaged part is left out and counted rather than failing the whole
 * pack; the files stay on the project either way (`M08-48`). An empty PDF is no pack.
 */
export async function packPdfOf(parts: readonly PackPart[]): Promise<PackMade> {
  const pack = await PDFDocument.create();
  let leftOut = 0;
  for (const part of parts) {
    try {
      await addPart(pack, part);
    } catch {
      leftOut += 1;
    }
  }
  return { bytes: pack.getPageCount() === 0 ? null : await pack.save(), leftOut };
}

async function addPart(pack: PDFDocument, part: PackPart): Promise<void> {
  if (part.contentType === 'application/pdf') {
    const source = await PDFDocument.load(part.bytes, { ignoreEncryption: true });
    const pages = await pack.copyPages(source, source.getPageIndices());
    for (const page of pages) pack.addPage(page);
    return;
  }
  const image =
    part.contentType === 'image/png'
      ? await pack.embedPng(part.bytes)
      : await pack.embedJpg(part.bytes);
  const room = { width: A4.width - 2 * MARGIN, height: A4.height - 2 * MARGIN };
  const scale = Math.min(1, room.width / image.width, room.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const page = pack.addPage([A4.width, A4.height]);
  page.drawImage(image, {
    x: (A4.width - width) / 2,
    y: (A4.height - height) / 2,
    width,
    height,
  });
}
