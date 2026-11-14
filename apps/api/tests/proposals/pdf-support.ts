import { createHash } from 'node:crypto';
import { OBJECT_STORE } from '@heliogrid/contracts';
import type { PrintedDocument } from '@heliogrid/contracts/workflows';
import { PDFDocument } from 'pdf-lib';
import type { MemoryObjectStore } from '../../src/modules/file/internal/object-store.memory';
import { ProposalsVersionsService } from '../../src/modules/proposals/proposals.public';
import type { ProposalsWorld } from './support';

/** A one-page PDF, as the renderer would print it. */
export async function aPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  return pdf.save();
}

export const sha256Of = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('base64');

/**
 * The renderer's half of a version's PDF (`proposalDocument`): the page step's signed address, the
 * bytes PUT through it, and the facts the keep step is handed.
 */
export async function printedThroughStore(
  world: ProposalsWorld,
  version: { readonly tenantId: string; readonly versionId: string },
  bytes: Uint8Array,
): Promise<PrintedDocument> {
  const page = await world.http.app.get(ProposalsVersionsService).page(version);
  if (page?.kind !== 'page') throw new Error(`expected a page, got ${JSON.stringify(page)}`);
  if (!world.http.app.get<MemoryObjectStore>(OBJECT_STORE).receive(page.put.url, bytes)) {
    throw new Error('the store refused the PUT through its signed address');
  }
  return { byteSize: bytes.length, checksumSha256: sha256Of(bytes) };
}
