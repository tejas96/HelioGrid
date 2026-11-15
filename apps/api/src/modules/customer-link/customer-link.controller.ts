import { customerLinksContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { readerOf } from '../crm/crm.public';
import { CustomerLinkService } from './customer-link.service';

const MINT = { capability: 'customer_link.mint_customer_link' } as const;
const REVOKE = { capability: 'customer_link.revoke_customer_link' } as const;

/**
 * The deal's link manager (`SCR-M06-20`, `F5-30`). Naming, renaming and re-addressing a link is
 * the mint grant's; turning one off the revoke grant's — the sellers who share proposals, and the
 * project manager once the deal is theirs. No row of the billing matrix pauses a customer's link
 * (`F5-23`), so none pauses the acts that keep one working either.
 */
@Controller()
export class CustomerLinkController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CustomerLinkService) private readonly links: CustomerLinkService) {}

  // Topmost, so it is applied last: it serves each route from what the maps below declared.
  @TsRestHandler(customerLinksContract)
  @RouteBillingMap(customerLinksContract, {
    mint: 'ungated',
    address: 'ungated',
    relabel: 'ungated',
    remint: 'ungated',
    revoke: 'ungated',
  })
  @RouteAccessMap(customerLinksContract, {
    ofLead: MINT,
    mint: MINT,
    address: MINT,
    relabel: MINT,
    remint: MINT,
    revoke: REVOKE,
  })
  handler(@Req() req: Request) {
    const reader = readerOf(req);
    const act = actOf(req);
    const ok = <Body>(body: Body) => ({ status: 200 as const, body });
    return tsRestHandler(customerLinksContract, {
      ofLead: async ({ params }) => ok(await this.links.ofLead(reader, params.id)),
      mint: async ({ params, body, headers }) => ({
        status: 201 as const,
        body: await this.links.mint(reader, params.id, body, headers, act),
      }),
      address: async ({ params }) => ok(await this.links.address(reader, params.id)),
      relabel: async ({ params, body }) =>
        ok(await this.links.relabel(reader, params.id, body.label, act)),
      remint: async ({ params, body }) =>
        ok(await this.links.remint(reader, params.id, body.revokeEarlier, act)),
      revoke: async ({ params }) => ok(await this.links.revoke(reader, params.id, act)),
    });
  }
}
