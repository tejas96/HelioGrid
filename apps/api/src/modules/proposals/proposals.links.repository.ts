import type { DbTransaction } from '@heliogrid/db';
import { Injectable } from '@nestjs/common';

/** What sharing asks of the customer-link module: the customer's own link on a lead. */
export interface ProposalLinks {
  /**
   * A share mints the customer's link where the lead holds no live one (`F5-20`): on the share's
   * own transaction, so a link exists once a proposal was shared — and again after a revoke. A
   * lead that holds a live one keeps it.
   */
  mintForCustomer(
    tx: DbTransaction,
    lead: { readonly tenantId: string; readonly leadId: string; readonly customerId: string },
    by: { readonly userId: string; readonly at: Date },
  ): Promise<void>;
  /** The address of the customer's own link on a lead, or `null` where none was minted. */
  addressOf(tenantId: string, leadId: string): Promise<string | null>;
}

/**
 * Who mints and addresses the customer's link (`F5-20`, `M06-53`): the customer-link module
 * registers itself when it starts, so this module asks without importing it — a proposal is what a
 * link serves, and the two would otherwise each need the other. Until one registers no link is
 * minted and a share's message carries none: nothing here invents an address.
 */
@Injectable()
export class ProposalLinksRegistry {
  private links: ProposalLinks | null = null;

  register(links: ProposalLinks): void {
    this.links = links;
  }

  async mintForCustomer(...ask: Parameters<ProposalLinks['mintForCustomer']>): Promise<void> {
    await this.links?.mintForCustomer(...ask);
  }

  async addressOf(tenantId: string, leadId: string): Promise<string | null> {
    return (await this.links?.addressOf(tenantId, leadId)) ?? null;
  }
}
