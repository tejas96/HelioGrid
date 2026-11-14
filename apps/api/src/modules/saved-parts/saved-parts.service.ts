import {
  type CreateHeaders,
  SAVED_PART_DUPLICATE,
  type SavedPart,
  type SavedPartsQuery,
  type SavedPartWrite,
  savedPartsContract,
} from '@heliogrid/contracts';
import type { SavedPartKind } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import {
  type PartOutcome,
  type SavedPartRow,
  SavedPartsRepository,
} from './saved-parts.repository';

function partWire(row: SavedPartRow): SavedPart {
  const { archivedAt, ...part } = row;
  return { ...part, archived: archivedAt !== null };
}

/**
 * The company's saved parts (`M06-28`, `T-M06-034`): added once, tapped on every later proposal —
 * brand, specification, warranty and one line for the customer; no price, no count, no stock.
 */
@Injectable()
export class SavedPartsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SavedPartsRepository) private readonly parts: SavedPartsRepository,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async list(tenantId: string, query: SavedPartsQuery) {
    const { rows, totalCount } = await this.parts.list(tenantId, {
      kind: query.kind,
      withArchived: query.archived === true,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return { items: rows.map(partWire), totalCount };
  }

  async add(
    tenantId: string,
    body: SavedPartWrite & { readonly kind: SavedPartKind },
    headers: CreateHeaders,
    act: Act,
  ): Promise<SavedPart> {
    const route = savedPartsContract.add;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const { kind, ...part } = body;
    const outcome = await this.parts.add(tenantId, kind, part, key, act);
    if (outcome.outcome === 'key-reused') return this.replies.rowOf(outcome, route, tenantId);
    if (outcome.outcome === 'replayed') {
      return partWire(
        this.replies.rowOf({ outcome: 'replayed', row: outcome.part }, route, tenantId),
      );
    }
    return answered(outcome);
  }

  async save(tenantId: string, partId: string, body: SavedPartWrite, act: Act): Promise<SavedPart> {
    return answered(await this.parts.save(tenantId, partId, body, act));
  }

  async setArchived(tenantId: string, partId: string, archived: boolean, act: Act) {
    return answered(await this.parts.setArchived(tenantId, partId, archived, act));
  }
}

function answered(outcome: PartOutcome): SavedPart {
  switch (outcome.outcome) {
    case 'saved':
    case 'replayed':
      return partWire(outcome.part);
    case 'duplicate':
      throw new ContractException(
        SAVED_PART_DUPLICATE,
        'That part is already saved.',
        HttpStatus.CONFLICT,
        undefined,
        { partId: outcome.partId },
      );
    default:
      throw new NotFoundException('No such part.');
  }
}
