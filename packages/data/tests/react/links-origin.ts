import type { IncomingMessage, ServerResponse } from 'node:http';
import { type CustomerLink, IDEMPOTENCY_KEY_HEADER } from '@heliogrid/contracts';
import { afterEach } from 'vitest';
import { send, writeBodyOf } from './origin-wire';
import { LEAD } from './proposals-fixtures';

/**
 * A deal's named links on the sell origin (`SCR-M06-20`, `F5-30`): the lead's list, a mint, an
 * address, a re-mint and Turn off, in the contract's shapes. Each write is recorded and answered
 * by the sell origin's own answer list, handed in.
 */

export const LINK = '01a30000-0000-7000-8000-00000000c001';
const MINTED = '01a30000-0000-7000-8000-00000000c002';

export const linkOf = (over: Partial<CustomerLink> = {}): CustomerLink => ({
  id: LINK,
  label: 'Anil Deshmukh',
  contact: null,
  status: 'active',
  mintedAt: '2026-11-10T10:00:00.000Z',
  mintedBy: null,
  opens: 0,
  lastOpenedAt: null,
  lastDeviceClass: null,
  answered: false,
  revokedAt: null,
  ...over,
});

interface LinkWrite {
  readonly path: string;
  readonly body: unknown;
  readonly key: string | undefined;
}

export const links: { held: CustomerLink[]; sent: LinkWrite[]; reads: number } = {
  held: [linkOf()],
  sent: [],
  reads: 0,
};

afterEach(() => Object.assign(links, { held: [linkOf()], sent: [], reads: 0 }));

const urlOf = (id: string) => `https://app.heliogrid.in/p/${id.slice(-4).repeat(11)}`;

/** The link `id` after the act on `path`; a new one for a mint. */
function actedOn(path: string, id: string, body: { label?: string }): CustomerLink {
  if (path.endsWith('/links') && path.startsWith('/leads/')) {
    const minted = linkOf({ id: MINTED, label: body.label ?? '' });
    links.held = [...links.held, minted];
    return minted;
  }
  const at = links.held.findIndex((one) => one.id === id);
  const was = links.held[at] ?? linkOf({ id });
  const now = path.endsWith('/revoke')
    ? { ...was, status: 'revoked' as const, revokedAt: '2026-11-14T10:00:00.000Z' }
    : path.endsWith('/label')
      ? { ...was, label: body.label ?? was.label }
      : was;
  links.held = links.held.map((one, index) => (index === at ? now : one));
  return now;
}

/**
 * Answers a link route — `false` when `path` is none of them. `answered` takes the sell origin's
 * next answer: `false` when it already answered (a refusal, a drop).
 */
export function answeredLinks(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  answered: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>,
): boolean {
  const ofLead = path === `/leads/${LEAD}/links`;
  const one = /^\/links\/([^/]+)\/(address|label|remint|revoke)$/.exec(path);
  if (!ofLead && one === null) return false;
  if (ofLead && req.method === 'GET') {
    links.reads += 1;
    send(res, req, 200, { links: links.held, contacts: [], acts: { mint: true, revoke: true } });
    return true;
  }
  void (async () => {
    const write = await writeBodyOf(req, res);
    if (write === null) return;
    const key = req.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;
    links.sent.push({ path, body: write.body, key });
    if (!(await answered(req, res))) return;
    const link = actedOn(path, one?.[1] ?? '', write.body as { label?: string });
    if (one?.[2] === 'revoke' || one?.[2] === 'label') return send(res, req, 200, link);
    send(res, req, ofLead ? 201 : 200, { link, url: urlOf(link.id) });
  })();
  return true;
}
