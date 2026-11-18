import { proposalsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { actorNameOf, readerOf } from '../crm/crm.public';
import { ProposalsGenerateService } from './proposals.generate.service';
import { ProposalsListService } from './proposals.list.service';
import { ProposalsService } from './proposals.service';
import { ProposalsShareService } from './proposals.share.service';
import { ProposalsVersionsService } from './proposals.versions.service';

const BUILD = { capability: 'proposals.create_edit_proposals' } as const;
const SEND = { capability: 'proposals.send_proposals' } as const;

/**
 * Proposals (`M06`). Reading is every member's, narrowed to the leads their presets reach
 * (`F2.M02.lead-visibility`); building is the create-and-edit grant's; sharing and withdrawing the
 * send grant's. In the billing matrix a draft's edits are record edits, and Generate and share are
 * the paused row (`sell_and_deliver`) — reading, the PDF and every customer link never pause.
 */
@Controller()
export class ProposalsController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsService) private readonly proposals: ProposalsService,
    @Inject(ProposalsGenerateService) private readonly generating: ProposalsGenerateService,
    @Inject(ProposalsShareService) private readonly sharing: ProposalsShareService,
    @Inject(ProposalsVersionsService) private readonly versions: ProposalsVersionsService,
    @Inject(ProposalsListService) private readonly lists: ProposalsListService,
  ) {}

  // Topmost, so it is applied last: it serves each route from what the maps below declared.
  @TsRestHandler(proposalsContract)
  @RouteBillingMap(proposalsContract, {
    start: 'create_edit_records',
    edit: 'create_edit_records',
    fillEnergy: 'create_edit_records',
    resetStep: 'create_edit_records',
    discard: 'create_edit_records',
    generate: 'sell_and_deliver',
    share: 'sell_and_deliver',
    withdraw: 'create_edit_records',
  })
  @RouteAccessMap(proposalsContract, {
    list: 'member',
    entries: 'member',
    start: BUILD,
    detail: 'member',
    edit: BUILD,
    fillEnergy: BUILD,
    resetStep: BUILD,
    discard: BUILD,
    generate: BUILD,
    versions: 'member',
    version: 'member',
    versionPdf: 'member',
    shareMessage: SEND,
    share: SEND,
    withdraw: SEND,
    acceptanceMessage: SEND,
  })
  handler(@Req() req: Request) {
    const reader = readerOf(req);
    const act = actOf(req);
    const ok = <Body>(body: Body) => ({ status: 200 as const, body });
    return tsRestHandler(proposalsContract, {
      list: async ({ query }) => ok(await this.lists.list(reader, query)),
      entries: async ({ query }) => ok(await this.lists.entries(reader, query)),
      start: async ({ params, body, headers }) => {
        const { created, proposal } = await this.proposals.start(
          reader,
          params.id,
          body,
          headers,
          act,
        );
        return created
          ? { status: 201 as const, body: proposal }
          : { status: 200 as const, body: proposal };
      },
      detail: async ({ params }) => ok(await this.proposals.detail(reader, params.id)),
      edit: async ({ params, body }) => ok(await this.proposals.edit(reader, params.id, body, act)),
      fillEnergy: async ({ params, body }) =>
        ok(await this.proposals.fillEnergy(reader, params.id, body, act)),
      resetStep: async ({ params, body }) =>
        ok(await this.proposals.resetStep(reader, params.id, body, act)),
      discard: async ({ params }) => {
        await this.proposals.discard(reader, params.id);
        return { status: 204 as const, body: undefined };
      },
      generate: async ({ params, body, headers }) => ({
        status: 201 as const,
        body: await this.generating.generate(reader, params.id, body, headers, act),
      }),
      versions: async ({ params }) =>
        ok({ versions: await this.versions.versions(reader, params.id) }),
      version: async ({ params }) =>
        ok(await this.versions.version(reader, params.id, params.version)),
      versionPdf: async ({ params }) =>
        ok(await this.versions.pdf(reader, params.id, params.version)),
      shareMessage: async ({ params }) =>
        ok(await this.sharing.shareMessage(reader, params.id, actorNameOf(req))),
      share: async ({ params, body }) =>
        ok(await this.sharing.share(reader, params.id, body, actorNameOf(req), act)),
      withdraw: async ({ params, body }) =>
        ok(await this.sharing.withdraw(reader, params.id, body.capturedAt, act)),
      acceptanceMessage: async ({ params }) =>
        ok(await this.sharing.acceptanceMessage(reader, params.id, actorNameOf(req))),
    });
  }
}
