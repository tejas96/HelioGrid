import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  IDEMPOTENCY_KEY_HEADER,
  type ProposalDetail,
  type ProposalTemplateRead,
  type ProposalVersion,
} from '@heliogrid/contracts';
import { DEFAULT_SECTIONS_INCLUDED, type DealSegment, richTextParagraphs } from '@heliogrid/domain';
import { cleanup } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { type Answer, answeredCompanyFacts } from './branding-origin';
import { priya } from './lead-detail-origin';
import { answeredLinks } from './links-origin';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';
import {
  customerPage,
  LEAD,
  NEWER_VERSION_ID,
  offPage,
  PROPOSAL,
  proposalDetail,
  proposalRow,
} from './proposals-fixtures';
import { actedOn, originActs, pdfAsked } from './proposals-origin-acts';

export { refusal } from './origin-wire';

/**
 * The sell loop end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin holding one draft and one customer's link, answering the proposal and customer-link
 * routes in the contract's shapes, each write the way a case needs.
 */

/** The 43-character secret a link's address carries, as the contract reads one. */
export const TOKEN = 'a'.repeat(43);

interface Write {
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
  readonly key: string | undefined;
}

interface SellOrigin {
  /** The market's chat address for the words; `null` where it names no chat app. */
  chatUri: string | null;
  /** The draft as stored: every taken commit moves its revision by one. */
  proposal: ProposalDetail;
  /** The next answers to a write, in order; an exhausted list takes the write. */
  writes: Answer[];
  /** Every write that reached the origin, in order. */
  sent: Write[];
  /** Whether `/auth/session` answers a company's person, or a visitor carrying no credential. */
  signedIn: boolean;
  /** The customer's page: answerable, already answered, a newer version, or one that cannot serve. */
  page: 'open' | 'answered' | 'newer' | 'off' | 'gone';
  /** Every list read's query, in order. */
  listAsks: URLSearchParams[];
  /** The lead already holds an open draft: a start resumes it (200) instead of making one (201). */
  hasDraft: boolean;
  /** A version's PDF: `null` while it is being made. */
  pdf: { url: string; expiresAt: string } | null;
  /** The kind of job the lead itself holds, as its own read answers it. */
  leadSegment: DealSegment | null;
  /** The generated versions, each frozen as `/proposals/:id/versions/:version` answers it. */
  versions: ProposalVersion[];
  /** How many times the proposal's own detail was read, and how long each answer is held. */
  detailReads: number;
  detailAfterMs: number;
  /** Proposal defaults as stored, in the platform's words until a save; the reader of each read. */
  template: ProposalTemplateRead;
  templateReaders: (string | null)[];
}

/** The company's template before any save: the platform's terms. */
export const PLATFORM_TERMS = richTextParagraphs(['This proposal is valid for 15 days.']);

/** The share sheet's words before the first share: the link's slot stands where the link will go. */
const MESSAGE = { language: 'en', text: 'Namaste Anil — {link}', link: null };

const fresh = (): SellOrigin => ({
  chatUri: 'https://wa.me/919900000001',
  proposal: proposalDetail({}),
  writes: [],
  sent: [],
  signedIn: true,
  page: 'open',
  listAsks: [],
  hasDraft: false,
  pdf: null,
  leadSegment: 'residential',
  versions: [],
  detailReads: 0,
  detailAfterMs: 0,
  template: {
    cover: null,
    sectionsIncluded: [...DEFAULT_SECTIONS_INCLUDED],
    defaultTerms: structuredClone(PLATFORM_TERMS) as ProposalTemplateRead['defaultTerms'],
    changed: null,
  },
  templateReaders: [],
});

export const sell: SellOrigin = fresh();

async function answered(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const answer = sell.writes.shift() ?? { status: 200 };
  if (answer === 'drop') {
    req.socket.destroy();
    return false;
  }
  if (answer.afterMs) await new Promise((resolve) => setTimeout(resolve, answer.afterMs));
  if (answer.status === 200) return true;
  send(res, req, answer.status, answer.body);
  return false;
}

/** A commit taken: the steps and lead facts it sent are stored, and the revision moves on. */
function committed(body: {
  fields?: Partial<ProposalDetail['document']['fields']>;
  deal?: { siteAddress?: string | null };
  quickMode?: boolean;
}): ProposalDetail {
  const was = sell.proposal;
  const price = body.fields?.system?.priceInclusive ?? was.document.fields.system.priceInclusive;
  sell.proposal = {
    ...proposalDetail({
      revision: was.revision + 1,
      priceInclusive: price,
      quickMode: body.quickMode ?? was.quickMode,
      siteAddress: body.deal?.siteAddress ?? was.document.deal.siteAddress,
    }),
  };
  return sell.proposal;
}

/** The proposal reads: the list under a chip, a version's PDF, the share's words, the detail. */
function answerProposalRead(req: IncomingMessage, res: ServerResponse, path: string) {
  if (path.endsWith('/pdf')) return send(res, req, 200, { download: pdfAsked(sell.pdf) });
  if (path.endsWith('/share-message'))
    return send(res, req, 200, { ...MESSAGE, chatUri: sell.chatUri });
  const frozen = /\/versions\/(\d+)$/.exec(path);
  if (frozen !== null) {
    const found = sell.versions.find((one) => one.version === Number(frozen[1]));
    return found === undefined
      ? send(res, req, 404, refusal('NOT_FOUND'))
      : send(res, req, 200, found);
  }
  if (path !== '/proposals') {
    sell.detailReads += 1;
    // The draft as it stood when the read arrived, answered after the hold.
    const asRead = sell.proposal;
    return void setTimeout(() => send(res, req, 200, asRead), sell.detailAfterMs);
  }
  const ask = new URL(req.url ?? '/', 'http://origin').searchParams;
  sell.listAsks.push(ask);
  const draft = proposalRow('01a30000-0000-7000-8000-00000000b002', 'draft');
  const opened = proposalRow('01a30000-0000-7000-8000-00000000b003', 'opened');
  const items = ask.get('filter') === 'draft' ? [draft] : [draft, opened];
  send(res, req, 200, {
    currencyCode: 'INR',
    rows: { items, totalCount: items.length },
    counts: { all: 2, waiting: 1, draft: 1, accepted: 0, closed: 0 },
    waitingValue: '190575.00',
    canStart: true,
  });
}

async function answerProposal(req: IncomingMessage, res: ServerResponse, path: string) {
  if (req.method === 'GET') return answerProposalRead(req, res, path);
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const key = req.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;
  sell.sent.push({ method: req.method ?? '', path, body: write.body, key });
  if (!(await answered(req, res))) return;
  const body = write.body as { revision?: number };
  if (body.revision !== undefined && body.revision !== sell.proposal.revision) {
    return send(res, req, 409, {
      error: {
        code: 'PROPOSAL_CHANGED_ELSEWHERE',
        message: 'changed elsewhere',
        requestId: 'test',
        facts: { revision: sell.proposal.revision, movedTo: null },
      },
    });
  }
  if (path.endsWith('/share')) {
    sell.proposal = proposalDetail({
      revision: sell.proposal.revision,
      status: 'shared',
      standing: 'shared',
    });
    return send(res, req, 200, {
      proposal: sell.proposal,
      message: { ...MESSAGE, link: 'https://app.heliogrid.in/p/abc', chatUri: sell.chatUri },
      followUpOn: originActs.followUpOn,
    });
  }
  if (path.endsWith('/generate')) {
    const proposal = { ...sell.proposal, status: 'draft', standing: 'ready' };
    return send(res, req, 201, { proposal, number: 'PRP-0042', version: 1 });
  }
  const acted = actedOn(sell.proposal, path, write.body);
  if (acted !== null) sell.proposal = acted;
  send(res, req, 200, acted ?? committed(write.body as Parameters<typeof committed>[0]));
}

async function answerStart(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const key = req.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;
  sell.sent.push({ method: req.method ?? '', path, body: write.body, key });
  if (!(await answered(req, res))) return;
  send(res, req, sell.hasDraft ? 200 : 201, sell.proposal);
}

function pageNow() {
  if (sell.page === 'off') return offPage();
  if (sell.page === 'newer') return customerPage({ versionId: NEWER_VERSION_ID });
  return customerPage(sell.page === 'answered' ? { answered: 'accept' } : {});
}

async function answerLink(req: IncomingMessage, res: ServerResponse, path: string) {
  if (sell.page === 'gone') return send(res, req, 404, refusal('NOT_FOUND'));
  if (req.method === 'GET' && path.endsWith('/pdf'))
    return send(res, req, 200, { download: sell.pdf });
  if (req.method === 'GET') return send(res, req, 200, pageNow());
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  sell.sent.push({ method: req.method ?? '', path, body: write.body, key: undefined });
  if (!(await answered(req, res))) return;
  if (path.endsWith('/opened') || path.endsWith('/viewed')) return send(res, req, 204);
  if (path.endsWith('/accept')) sell.page = 'answered';
  send(res, req, 200, pageNow());
}

/** A settings write — step 11's account, step 9's terms as the default: stored as sent. */
async function answerSettingsSave(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  sell.sent.push({ method: req.method ?? '', path, body: write.body, key: undefined });
  if (!(await answered(req, res))) return;
  if (path !== '/settings/proposal-template') return send(res, req, 200, write.body);
  sell.template = { ...(write.body as ProposalTemplateRead), changed: null };
  send(res, req, 200, sell.template);
}

function answer(req: IncomingMessage, res: ServerResponse) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  const settingsWrite =
    path === '/settings/business-profile' || path === '/settings/proposal-template';
  if (settingsWrite && req.method === 'PUT') return void answerSettingsSave(req, res, path);
  if (path === '/settings/proposal-template') {
    sell.templateReaders.push(new URL(req.url ?? '/', 'http://origin').searchParams.get('reader'));
    return send(res, req, 200, sell.template);
  }
  // A visitor carrying no credential: the session read answers, and says nobody is signed in.
  if (path === '/auth/session' && !sell.signedIn) return send(res, req, 200, { signedIn: false });
  if (answeredCompanyFacts(req, res)) return;
  if (path.startsWith('/customer-link/')) return void answerLink(req, res, path);
  if (answeredLinks(req, res, path, answered)) return;
  if (path === `/leads/${LEAD}/proposals`) return void answerStart(req, res, path);
  if (path === `/leads/${LEAD}`) {
    const lead = priya();
    return send(res, req, 200, {
      ...lead,
      lead: { ...lead.lead, id: LEAD, segment: sell.leadSegment },
    });
  }
  if (path === '/proposals' || path.startsWith(`/proposals/${PROPOSAL}`)) {
    return void answerProposal(req, res, path);
  }
  send(res, req, 404, refusal('NOT_FOUND'));
}

const listening = listeningOrigin(answer);

afterEach(() => {
  cleanup();
  Object.assign(sell, fresh());
});

/** The real provider over the origin, for `renderHook`'s wrapper. */
export function provided() {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  return ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
}

/** A refusal with its facts, as the contract's `errorEnvelopeWithFacts` carries one. */
export const refusalWith = (code: string, facts: unknown) => ({
  error: { code, message: code, requestId: 'test', facts },
});
