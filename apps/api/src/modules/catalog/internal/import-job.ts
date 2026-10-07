import { NotFoundException } from '@nestjs/common';
import type { CatalogImportRepository, ImportJobRow } from '../catalog.import.repository';

/** The price lists an import reads are stored against the company's catalog (`T-M01-030` part a). */
export const PRICE_LIST = 'catalog';

/** The job, or the 404 a person sees for one that is not their company's — never a 403. */
export async function importJobOf(
  jobs: CatalogImportRepository,
  tenantId: string,
  id: string,
): Promise<ImportJobRow> {
  const job = await jobs.find(tenantId, id);
  if (job === null) throw new NotFoundException('That import is not in this company’s catalog.');
  return job;
}
