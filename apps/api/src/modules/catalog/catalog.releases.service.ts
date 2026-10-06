import {
  type CatalogReleaseDetailWire,
  type CatalogReleaseWire,
  type CatalogReleaseWrite,
  type CreateHeaders,
  catalogReleasesContract,
  type Paginated,
  type PaginationQuery,
  type RoleSet,
} from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { CatalogReleaseReadsRepository } from './catalog.release-reads.repository';
import { CatalogReleasesRepository } from './catalog.releases.repository';
import { CatalogService } from './catalog.service';
import { releaseLineWire, releaseWire } from './internal/release-wire';
import { admitWrite } from './internal/write-checks';

/**
 * The tenant's catalog releases (`M01-43`): publishing is the outright manage grant's (c6), and
 * a release is read by whoever reads prices — the route's door admits Finance's limited cell.
 */
@Injectable()
export class CatalogReleasesService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogReleasesRepository) private readonly publishes: CatalogReleasesRepository,
    @Inject(CatalogReleaseReadsRepository) private readonly reads: CatalogReleaseReadsRepository,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async publish(
    tenantId: string,
    roles: RoleSet,
    body: CatalogReleaseWrite,
    headers: CreateHeaders,
    act: Act,
  ): Promise<CatalogReleaseWire> {
    admitWrite(roles);
    const { resolve } = await this.catalog.scopeOf(tenantId, act.now);
    const route = catalogReleasesContract.publish;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const outcome = await this.publishes.publish(tenantId, body.label, resolve, act, key);
    switch (outcome.outcome) {
      case 'label-taken':
        throw new ContractException(
          'CATALOG_LABEL_TAKEN',
          'A release already has this name.',
          HttpStatus.CONFLICT,
          [{ path: 'label', issue: 'taken' }],
        );
      case 'nothing-changed':
        throw new ContractException(
          'CATALOG_NOTHING_CHANGED',
          'Nothing in the catalog changed since the last release.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      default: {
        const head = await this.reads.head(tenantId, this.replies.rowOf(outcome, route, tenantId));
        if (head === null) throw new Error('a published release reads back as absent');
        return releaseWire(head);
      }
    }
  }

  async releases(tenantId: string, page: PaginationQuery): Promise<Paginated<CatalogReleaseWire>> {
    const { heads, totalCount } = await this.reads.heads(tenantId, offsetOf(page));
    return { items: heads.map(releaseWire), totalCount };
  }

  async release(
    tenantId: string,
    id: string,
    page: PaginationQuery,
    now: number,
  ): Promise<CatalogReleaseDetailWire> {
    const found = await this.reads.release(tenantId, id, offsetOf(page));
    if (found === null)
      throw new NotFoundException('That release is not in this company’s catalog.');
    const digits = (await this.catalog.scopeOf(tenantId, now)).resolve.minorUnitDigits;
    return {
      release: releaseWire(found.head),
      lines: {
        items: found.lines.map((line) => releaseLineWire(line, digits)),
        totalCount: found.totalCount,
      },
    };
  }
}

const offsetOf = (page: PaginationQuery) => ({
  limit: page.limit,
  offset: (page.page - 1) * page.limit,
});
