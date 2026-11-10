import {
  customerMergeContract,
  type MergeCustomers,
  type Merged,
  type MergePreview,
} from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import { CrmMergeRepository } from './crm.merge.repository';
import type { LeadReader } from './internal/reader';

const notFound = () => new NotFoundException('No such customer.');

/**
 * Customer merge (`M02-59`…`M02-63`): the compare read and the one-transaction merge. A customer
 * outside the person's scope or already merged makes the pair unavailable with its reason; a field
 * the two disagree on with no side picked is refused naming each.
 */
@Injectable()
export class CrmMergeService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmMergeRepository) private readonly merges: CrmMergeRepository) {}

  async preview(
    reader: LeadReader,
    pair: { readonly survivorId: string; readonly loserId: string },
  ): Promise<MergePreview> {
    if (pair.survivorId === pair.loserId) {
      throw new ContractException(
        'VALIDATION_FAILED',
        'Some fields need attention.',
        HttpStatus.BAD_REQUEST,
        [{ path: 'loserId', issue: 'a customer is not merged into itself' }],
      );
    }
    const preview = await this.merges.preview(reader, pair);
    if (preview === null) throw notFound();
    return preview;
  }

  async merge(reader: LeadReader, input: MergeCustomers, act: Act): Promise<Merged> {
    const outcome = await this.merges.merge(reader, input, act);
    const declared = customerMergeContract.merge.responses;
    switch (outcome.kind) {
      case 'merged':
        return { survivor: outcome.survivor, leadId: outcome.leadId };
      case 'not-found':
        throw notFound();
      case 'needs_picks':
        throw refusalWithFacts(declared[422], HttpStatus.UNPROCESSABLE_ENTITY, {
          code: 'MERGE_CHOICES_MISSING',
          message: 'Choose a side for every field the two records disagree on.',
          facts: { unpicked: [...outcome.unpicked] },
        });
      case 'blocked':
        throw outcome.block === 'out_of_scope'
          ? new ContractException(
              'MERGE_OUT_OF_SCOPE',
              'One of these records is outside what you can see.',
              HttpStatus.CONFLICT,
            )
          : new ContractException(
              'CUSTOMER_ALREADY_MERGED',
              'One of these records was already merged.',
              HttpStatus.CONFLICT,
            );
    }
  }
}
