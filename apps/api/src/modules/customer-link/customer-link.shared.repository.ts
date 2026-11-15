import type { TenantPool } from '@heliogrid/db';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type ProposalLinks, ProposalLinksRegistry } from '../proposals/proposals.public';
import { customersLinkOf, liveTokenOf, mintForCustomer } from './customer-link.mint.repository';
import { linkAddressOf } from './internal/link-secret';

/**
 * What sharing asks of this module (`F5-20`, `M06-53`): a share mints the customer's own link,
 * where none is live, on the share's transaction, and a share's message carries that link's address. Registered
 * with the proposals module when this one starts, so proposals never imports it.
 */
@Injectable()
export class SharedProposalLinks implements ProposalLinks, OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(ProposalLinksRegistry) private readonly registry: ProposalLinksRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  mintForCustomer(...ask: Parameters<ProposalLinks['mintForCustomer']>): Promise<void> {
    return mintForCustomer(...ask);
  }

  addressOf(tenantId: string, leadId: string): Promise<string | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const own = await customersLinkOf(tx, tenantId, leadId);
      const tokenId = own === null ? null : await liveTokenOf(tx, tenantId, own.id);
      return tokenId === null ? null : linkAddressOf(tokenId);
    });
  }
}
