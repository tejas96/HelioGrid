import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  type DesignDetail,
  type DesignWire,
  IDEMPOTENCY_KEY_HEADER,
  type SaveSite,
  type SessionProjection,
} from '@heliogrid/contracts';
import type { RolePreset } from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';
import { DOCUMENT_ROUTES } from './studio-document-origin';
import { placesAnswer } from './studio-places-origin';
import { DESIGNS_ROLE, mayDesign } from './studio-roles';

export { MUNICH, SANGLI } from './studio-places-origin';
export { DESIGNS_ROLE, READS_ONLY_ROLE } from './studio-roles';

/**
 * A lead's designs end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that keeps one lead's designs, numbers a new one as the api does — the same retry key
 * again makes no second — keeps one recommended at most, and answers a case the way it needs:
 * queued, held or dropped.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const id = (n: number) => `01a50000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const TENANT = id(1);
export const READER = { userId: id(2), name: 'Asha Patil' };
export const LEAD_ID = id(101);
export const AT = '2026-11-10T05:00:00.000Z';
export const designId = (ordinal: number) => id(600 + ordinal);

/** A design of the lead as the api lists it. */
export const aDesign = (ordinal: number, typed: Partial<DesignWire> = {}): DesignWire => ({
  id: designId(ordinal),
  ordinal,
  mount: 'roof',
  status: 'draft',
  recommended: false,
  createdBy: READER,
  createdAt: AT,
  updatedAt: AT,
  ...typed,
});

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

/** The site the origin's lead holds, as a design reads it. */
type Site = DesignDetail['site'];
const NO_SITE: Site = {
  name: null,
  address: null,
  pin: null,
  area: null,
  utilityOperator: null,
  supplyPhase: null,
  sanctionedLoadKw: null,
};

interface Origin {
  roles: readonly RolePreset[];
  designs: DesignWire[];
  site: Site;
  /** What the lead says of the site's roof; `null` where no one has said. */
  siteRoof: DesignDetail['subject']['siteRoof'];
  /** The map service answers; `false` is a service that is down. */
  placesUp: boolean;
  /** The design each retry key made. */
  madeWith: Map<string, DesignWire>;
  /** The next answers to a write, in order, keyed `create`, `recommend` or `site`. */
  answers: Map<string, Answer[]>;
  /** While set, every write waits for it — the act is out until the test lets it go. */
  gate: Promise<void> | null;
  /** Every request's method and path, in order. */
  sent: string[];
  writes: { path: string; body: unknown; key: string }[];
}

const START = (): Origin => ({
  roles: [DESIGNS_ROLE],
  designs: [],
  site: NO_SITE,
  siteRoof: null,
  placesUp: true,
  madeWith: new Map(),
  answers: new Map(),
  gate: null,
  sent: [],
  writes: [],
});

export const origin: Origin = START();

/** Queues `answers` for the next writes naming `key`. */
export function answerNext(key: string, ...answers: Answer[]) {
  origin.answers.set(key, [...(origin.answers.get(key) ?? []), ...answers]);
}

/** Holds every write until the returned release is called. */
export function holdWrites(): () => void {
  let release = () => {};
  origin.gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return () => {
    origin.gate = null;
    release();
  };
}

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER.userId,
      phoneE164: '+919900000002',
      displayName: READER.name,
      interfaceLanguage: 'en',
      unitPreference: 'metric',
      studioHelpersOff: [] as string[],
      numberEntry: 'slider',
    },
    membership: { tenantId: TENANT, roles: origin.roles, authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

/** The designs newest first, as the api lists them. */
const listed = () => ({
  designs: [...origin.designs].sort((a, b) => b.ordinal - a.ordinal),
  canDesign: origin.roles.some(mayDesign),
});

const detailOf = (design: DesignWire): DesignDetail => ({
  design,
  site: origin.site,
  subject: {
    leadId: LEAD_ID,
    customerName: 'Anil Sharma',
    customerPhone: '+919876543210',
    siteRoof: origin.siteRoof,
  },
  canEdit: origin.roles.some(mayDesign),
});

/** Site details saved whole: the site's facts on the lead, roof or ground on the design. */
function siteSaved(id: string, body: SaveSite): DesignDetail | null {
  const design = origin.designs.find((one) => one.id === id);
  if (design === undefined) return null;
  const { mount, capturedAt: _capturedAt, ...site } = body;
  origin.site = site;
  origin.designs = origin.designs.map((one) => (one.id === id ? { ...one, mount } : one));
  return detailOf({ ...design, mount });
}

/** The lead's next design: the same retry key again answers the one it made. */
function made(body: { copyOf: string | null }, key: string): DesignWire {
  const before = origin.madeWith.get(key);
  if (before !== undefined) return before;
  const source = origin.designs.find((one) => one.id === body.copyOf);
  const next = aDesign(origin.designs.length + 1, { mount: source?.mount ?? 'roof' });
  origin.designs = [...origin.designs, next];
  if (key !== '') origin.madeWith.set(key, next);
  return next;
}

/** The mark set or taken off: a lead carries it on one design at most. */
function marked(designIdAsked: string, recommended: boolean) {
  origin.designs = origin.designs.map((one) =>
    one.id === designIdAsked
      ? { ...one, recommended }
      : recommended
        ? { ...one, recommended: false }
        : one,
  );
  return listed();
}

/** A write: the next answer queued for `key`, else what the route answers on success. */
async function answerWrite(
  req: IncomingMessage,
  res: ServerResponse,
  key: string,
  success: (body: unknown, retryKey: string) => Answer,
) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const retryKey = String(req.headers[IDEMPOTENCY_KEY_HEADER] ?? '');
  origin.writes.push({ path, body: write.body, key: retryKey });
  if (origin.gate !== null) await origin.gate;
  const answer = origin.answers.get(key)?.shift() ?? success(write.body, retryKey);
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

const RECOMMENDED = /^\/designs\/([^/]+)\/recommended$/;
const SITE = /^\/designs\/([^/]+)\/site$/;
const DESIGN = /^\/designs\/([^/]+)$/;

type Route = (req: IncomingMessage, res: ServerResponse, path: string) => boolean;

/** A lead's designs: the list, and the next one made. */
const leadDesigns: Route = (req, res, path) => {
  if (path !== `/leads/${LEAD_ID}/designs`) return false;
  if (req.method === 'GET') send(res, req, 200, listed());
  else {
    void answerWrite(req, res, 'create', (body, retryKey) => ({
      status: 201,
      body: detailOf(made(body as { copyOf: string | null }, retryKey)),
    }));
  }
  return true;
};

/** One design opened; 404 for one the origin does not hold. */
const oneDesign: Route = (req, res, path) => {
  const one = DESIGN.exec(path);
  if (one === null || req.method !== 'GET') return false;
  const design = origin.designs.find((each) => each.id === one[1]);
  if (design === undefined) send(res, req, 404, refusal('NOT_FOUND'));
  else send(res, req, 200, detailOf(design));
  return true;
};

/** Site details saved whole. */
const siteOfDesign: Route = (req, res, path) => {
  const site = SITE.exec(path);
  if (site === null || req.method !== 'PUT') return false;
  void answerWrite(req, res, 'site', (body) => {
    const saved = siteSaved(site[1] ?? '', body as SaveSite);
    return saved === null
      ? { status: 404, body: refusal('NOT_FOUND') }
      : { status: 200, body: saved };
  });
  return true;
};

/** The recommended mark set or taken off. */
const recommended: Route = (req, res, path) => {
  const mark = RECOMMENDED.exec(path);
  if (mark === null || req.method !== 'PUT') return false;
  void answerWrite(req, res, 'recommend', (body) => ({
    status: 200,
    body: marked(mark[1] ?? '', (body as { recommended: boolean }).recommended),
  }));
  return true;
};

/** The place search. */
const places: Route = (req, res, path) => {
  if (!path.startsWith('/places/')) return false;
  const { searchParams } = new URL(req.url ?? '/', 'http://origin');
  send(res, req, 200, placesAnswer(path, searchParams, origin.placesUp));
  return true;
};

/** The reader's own profile write: what it sends is stored and answered, as the api does. */
const myProfile: Route = (req, res, path) => {
  if (path !== '/users/me' || req.method !== 'PATCH') return false;
  const { userId, displayName, ...rest } = projection().actor;
  const answer = (body: unknown) => ({
    id: userId,
    name: displayName,
    ...rest,
    ...(body as object),
  });
  void answerWrite(req, res, 'me', (body) => ({ status: 200, body: answer(body) }));
  return true;
};

const ROUTES: readonly Route[] = [leadDesigns, oneDesign, siteOfDesign, recommended, places];
const ALL_ROUTES = [...ROUTES, myProfile, ...DOCUMENT_ROUTES];

const served = listeningOrigin((req, res) => {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.sent.push(`${req.method} ${path}`);
  if (path === '/auth/session') return send(res, req, 200, projection());
  if (!ALL_ROUTES.some((route) => route(req, res, path))) send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, START());
});

/** A hook mounted in the real provider over the origin, inside `inside`: a host's readers, say. */
export function mountedOver<P, T>(hook: (props: P) => T, initialProps?: P, inside = same) {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    inside(createElement(DataProvider, { layer, children }));
  return renderHook(hook, { wrapper, initialProps });
}
const same = (children: ReactNode): ReactNode => children;
/** How many times `path` was read. */
export const readsOf = (path: string) => origin.sent.filter((one) => one === `GET ${path}`).length;

/** Long enough for a read the hook would send to have reached the origin. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
