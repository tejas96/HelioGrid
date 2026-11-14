import {
  customerLinkPublicContract,
  SESSION_RESOLVER,
  type SessionResolver,
} from '@heliogrid/contracts';
import {
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { ProposalsPrintService } from '../proposals/proposals.public';
import { CustomerLinkActsService } from './customer-link.acts.service';
import { CustomerLinkPageService } from './customer-link.page.service';
import { PublicCeiling } from './internal/public-ceiling';

/** A user agent longer than this is cut: the record keeps what identifies the session, not a payload. */
const USER_AGENT_MAX = 500;

const noSuchLink = () => new NotFoundException('No such link.');

/**
 * The customer's side of the link (`F5-01`, `F5-21`): every route public — the token is the whole
 * authority, so none takes a session — and none ever paused by the company's billing state
 * (`F5-23`). Each network address has its share of them all (`F5-78`); past it that caller alone
 * is asked to wait.
 */
@Controller()
export class CustomerLinkPublicController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CustomerLinkPageService) private readonly pages: CustomerLinkPageService,
    @Inject(CustomerLinkActsService) private readonly acts: CustomerLinkActsService,
    @Inject(ProposalsPrintService) private readonly prints: ProposalsPrintService,
    @Inject(PublicCeiling) private readonly ceiling: PublicCeiling,
    @Inject(SESSION_RESOLVER) private readonly sessions: SessionResolver,
  ) {}

  /**
   * The signed-in reader, if any, under whichever company: one who belongs to the link's own
   * company is never an open (`T-F5-007`), whatever company they act under now.
   */
  private async readerOf(req: Request): Promise<string | null> {
    return (await this.sessions.resolve(req))?.session.actor.userId ?? null;
  }

  // Topmost, so it is applied last: it serves each route from what the maps below declared.
  @TsRestHandler(customerLinkPublicContract)
  @RouteBillingMap(customerLinkPublicContract, {
    opened: 'ungated',
    sectionViewed: 'ungated',
    accept: 'ungated',
    negotiate: 'ungated',
    decline: 'ungated',
    question: 'ungated',
    callRequest: 'ungated',
  })
  @RouteAccessMap(customerLinkPublicContract, {
    page: 'public',
    opened: 'public',
    sectionViewed: 'public',
    accept: 'public',
    negotiate: 'public',
    decline: 'public',
    question: 'public',
    callRequest: 'public',
    file: 'public',
    pdf: 'public',
    print: 'public',
  })
  handler(@Req() req: Request) {
    const now = Date.now();
    const ok = <Body>(body: Body) => ({ status: 200 as const, body });
    const done = { status: 204 as const, body: undefined };
    const session = {
      networkAddress: req.ip ?? '',
      userAgent: (req.headers['user-agent'] ?? '').slice(0, USER_AGENT_MAX),
    };
    /** The caller's share of every route the customer's side serves; the renderer's read is not theirs. */
    const admit = () => {
      if (this.ceiling.admits(session.networkAddress, now)) return;
      throw new HttpException(
        `Too many visits right now. Try again in ${this.ceiling.backoffSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    };
    return tsRestHandler(customerLinkPublicContract, {
      page: async ({ params }) => {
        admit();
        const page = await this.pages.page(params.token, now);
        if (page === null) throw noSuchLink();
        return ok(page);
      },
      opened: async ({ params, body }) => {
        admit();
        await this.acts.opened(params.token, body.deviceClass, await this.readerOf(req), now);
        return done;
      },
      sectionViewed: async ({ params, body }) => {
        admit();
        await this.acts.viewed(
          params.token,
          body.section,
          body.seconds,
          await this.readerOf(req),
          now,
        );
        return done;
      },
      accept: async ({ params, body }) => {
        admit();
        const ask = { answer: 'accept' as const, versionId: body.versionId, words: null };
        return ok(await this.acts.answer(params.token, ask, session, now));
      },
      negotiate: async ({ params, body }) => {
        admit();
        const ask = { answer: 'negotiate' as const, versionId: body.versionId, words: body.words };
        return ok(await this.acts.answer(params.token, ask, session, now));
      },
      decline: async ({ params, body }) => {
        admit();
        const ask = { answer: 'decline' as const, versionId: body.versionId, words: body.reason };
        return ok(await this.acts.answer(params.token, ask, session, now));
      },
      question: async ({ params, body }) => {
        admit();
        return ok(await this.acts.question(params.token, body.text, now));
      },
      callRequest: async ({ params, body }) => {
        admit();
        return ok(await this.acts.callRequest(params.token, body.at, now));
      },
      file: async ({ params }) => {
        admit();
        const download = await this.pages.file(params.token, params.fileId, now);
        if (download === null) throw noSuchLink();
        return ok(download);
      },
      pdf: async ({ params }) => {
        admit();
        const pdf = await this.pages.pdf(params.token, now);
        if (pdf === undefined) throw noSuchLink();
        return ok(pdf);
      },
      print: async ({ params, query }) => {
        const document = await this.prints.printable(params.versionId, query.grant, now);
        if (document === null) throw new NotFoundException('No such version.');
        return ok({ document });
      },
    });
  }
}
