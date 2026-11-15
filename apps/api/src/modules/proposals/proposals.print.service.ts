import type { ProposalDocument } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ENV } from '../../config/env';
import { SettingsService } from '../settings/settings.public';
import { documentWire } from './internal/document-wire';
import { printGrantHolds } from './internal/print-grant';
import { ProposalsAssembler } from './proposals.assembler.service';
import type { ServedVersion } from './proposals.link.repository';
import { ProposalsPrintAdminRepository } from './proposals.print.admin.repository';
import { ProposalsVersionsRepository } from './proposals.versions.repository';

/**
 * A frozen version as the customer's side reads it (`F5-38`, `M06-50`): the print page behind its
 * grant, and the customer's link — the same mapping the operator's document goes through, with our
 * cost and the margin never in it and no user id on it.
 */
@Injectable()
export class ProposalsPrintService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsPrintAdminRepository) private readonly owners: ProposalsPrintAdminRepository,
    @Inject(ProposalsVersionsRepository) private readonly versions: ProposalsVersionsRepository,
    @Inject(ProposalsAssembler) private readonly assembler: ProposalsAssembler,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  /** The version a print grant names, or `null`: no such version, or a grant that does not hold. */
  async printable(versionId: string, grant: string, now: number): Promise<ProposalDocument | null> {
    if (!printGrantHolds(ENV.AUTH_TOKEN_SECRET, versionId, grant, now)) return null;
    const tenantId = await this.owners.tenantOf(versionId);
    if (tenantId === null) return null;
    const version = await this.versions.byId(tenantId, versionId);
    return version === null ? null : this.documentOf(tenantId, version);
  }

  /** A served version's document, as the customer's link and the print page draw it. */
  async documentOf(tenantId: string, version: ServedVersion): Promise<ProposalDocument> {
    const pack = await this.settings.packOf(tenantId);
    return documentWire(
      version.snapshot,
      {
        number: version.number,
        version: version.version,
        date: version.generatedAt,
        ...(await this.assembler.pictures(tenantId, version.snapshot)),
        preparedByUserId: null,
      },
      { minorUnitDigits: pack.formats.minorUnitDigits, seesCost: false },
    );
  }
}
