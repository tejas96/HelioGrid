import { type AttachLeadFile, LEAD_FILE_NOT_READY, type LeadFiles } from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { CrmLeadFilesRepository } from './crm.lead-files.repository';
import type { LeadReader } from './internal/reader';

const notFound = () => new NotFoundException('No such lead.');

/**
 * A lead's files (`M02-32`): the customer's papers kept with the lead. A file is stored against the
 * lead first; one not finished uploading, or stored for another record, is refused by name.
 */
@Injectable()
export class CrmLeadFilesService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmLeadFilesRepository) private readonly files: CrmLeadFilesRepository) {}

  async list(reader: LeadReader, leadId: string): Promise<LeadFiles> {
    const items = await this.files.list(reader, leadId);
    if (items === null) throw notFound();
    return { items };
  }

  async attach(
    reader: LeadReader,
    leadId: string,
    body: AttachLeadFile,
    act: Act,
  ): Promise<LeadFiles> {
    const outcome = await this.files.attach(reader, leadId, body, act);
    if (outcome.outcome === 'not-found') throw notFound();
    if (outcome.outcome === 'not-ready') {
      throw new ContractException(
        LEAD_FILE_NOT_READY,
        'The file has not finished uploading, or it was not stored for this lead.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return { items: outcome.items };
  }
}
