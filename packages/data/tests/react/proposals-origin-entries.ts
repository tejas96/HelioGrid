import type { IncomingMessage, ServerResponse } from 'node:http';
import { IDEMPOTENCY_KEY_HEADER } from '@heliogrid/contracts';
import { send, writeBodyOf } from './origin-wire';
import { designEntry, designMade, LEAD, proposalRow } from './proposals-fixtures';

/** What the sell origin keeps of these routes: each page read's chip, and each write as sent. */
interface EntriesHeld {
  readonly entryAsks: URLSearchParams[];
  readonly sent: { method: string; path: string; body: unknown; key: string | undefined }[];
}

/** The Proposals page: a design with no proposal yet first, then the two proposals, under a chip. */
function answerEntries(req: IncomingMessage, res: ServerResponse, held: EntriesHeld) {
  const ask = new URL(req.url ?? '/', 'http://origin').searchParams;
  held.entryAsks.push(ask);
  const design = designEntry();
  const draft = {
    kind: 'proposal',
    ...proposalRow('01a30000-0000-7000-8000-00000000b002', 'draft'),
  };
  const opened = {
    kind: 'proposal',
    ...proposalRow('01a30000-0000-7000-8000-00000000b003', 'opened'),
  };
  const chip = ask.get('filter');
  const items = chip === 'draft' ? [draft] : chip === '3d' ? [design] : [design, draft, opened];
  send(res, req, 200, {
    currencyCode: 'INR',
    rows: { items, totalCount: items.length },
    counts: { '3d': 1, all: 3, waiting: 1, draft: 1, accepted: 0, closed: 0 },
    waitingValue: '190575.00',
    canStart: true,
  });
}

/** *With 3D design*: the lead's next design, made and answered as the studio does. */
async function answerDesignMade(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  held: EntriesHeld,
  answered: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>,
) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const key = req.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;
  held.sent.push({ method: req.method ?? '', path, body: write.body, key });
  if (!(await answered(req, res))) return;
  send(res, req, 201, designMade());
}

/**
 * Answers the Proposals page (`T-M05-001b`) and the lead's design create over what `held` keeps —
 * `false` when `path` is neither. `answered` takes the sell origin's next answer: `false` when it
 * already answered.
 */
export function answeredEntriesOf(held: EntriesHeld) {
  return (
    req: IncomingMessage,
    res: ServerResponse,
    path: string,
    answered: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>,
  ): boolean => {
    if (path === '/proposal-entries') answerEntries(req, res, held);
    else if (path === `/leads/${LEAD}/designs`)
      void answerDesignMade(req, res, path, held, answered);
    else return false;
    return true;
  };
}
