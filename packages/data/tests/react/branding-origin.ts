import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BrandingRead, BrandingSave, SessionProjection } from '@heliogrid/contracts';
import { compliantShades, IN_TAX, ROLE_PRESETS } from '@heliogrid/domain';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useBranding } from '../../src/react/use-branding';
import type { ChosenPicture } from '../../src/react/use-company-logo';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

export { refusal } from './origin-wire';

/**
 * The Branding page end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that answers the branding, profile, registration, company, pack and file routes in the
 * contract's shapes, the branding save and the logo's complete each the way a case needs.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE] = ROLE_PRESETS;
const TENANT = '01a30000-0000-7000-8000-000000000001';
const USER = '01a30000-0000-7000-8000-000000000002';
export const SAVED_LOGO = '01a30000-0000-7000-8000-000000000101';
const NEW_LOGO = '01a30000-0000-7000-8000-000000000102';

/** What the origin answers a write with: a status and body, no answer at all, or later. */
export type Answer = { status: number; body?: unknown; afterMs?: number } | 'drop';

interface Origin {
  branding: BrandingRead;
  logoFileId: string | null;
  /** The next answers to `PUT /settings/branding`; an exhausted list answers the save applied. */
  saves: Answer[];
  /** The next answers to a file's complete; an exhausted list confirms it. */
  completes: Answer[];
  /** Answer the save as an api built before the logo rode it: the field stripped, unsaved. */
  stripsLogo: boolean;
  /** Every save's body, in order. */
  bodies: BrandingSave[];
  declares: number;
}

const NEVER_SAVED: BrandingRead = {
  brandColour: null,
  letterhead: null,
  shades: null,
  logoFileId: null,
  changed: null,
};

export const origin: Origin = {
  branding: structuredClone(NEVER_SAVED),
  logoFileId: null,
  saves: [],
  completes: [],
  stripsLogo: false,
  bodies: [],
  declares: 0,
};

function projection(): SessionProjection {
  return {
    actor: {
      userId: USER,
      phoneE164: '+919999999901',
      displayName: 'Rajesh Kulkarni',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: [OWNER_ROLE], authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

const TENANT_READ = {
  id: TENANT,
  companyName: 'Suryodaya Solar',
  city: 'Pune',
  marketCode: 'IN',
  currencyCode: 'INR',
  defaultLanguage: 'en',
  timezone: 'Asia/Kolkata',
  segment: null,
  typicalSystemKwp: null,
};

const PACK_READ = {
  market: 'IN',
  revision: 1,
  publishedAt: '2026-10-01T00:00:00.000Z',
  version: 'IN@1',
  tax: IN_TAX,
};

const profileRead = () => ({
  companyName: 'Suryodaya Solar Pvt Ltd',
  city: 'Pune',
  segment: null,
  typicalSystemKwp: null,
  address: 'Shop 14, Laxmi Complex, Baner Road',
  postalCode: '411045',
  logoFileId: origin.logoFileId,
  bankDetails: null,
  bankDetailsTyped: null,
});

const storedFile = (id: string) => ({
  id,
  subjectKind: 'tenant',
  subjectRef: TENANT,
  contentType: 'image/png',
  byteSize: 4,
  checksumSha256: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
  uploadedAt: '2026-10-25T10:00:00.000Z',
});

async function answerSave(req: IncomingMessage, res: ServerResponse) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const body = write.body as BrandingSave;
  origin.bodies.push(body);
  const answer = origin.saves.shift() ?? { status: 200 };
  if (answer === 'drop') return void req.socket.destroy();
  if (answer.afterMs) await new Promise((resolve) => setTimeout(resolve, answer.afterMs));
  if (answer.status !== 200) return send(res, req, answer.status, answer.body);
  if (!origin.stripsLogo && body.logoFileId !== undefined) origin.logoFileId = body.logoFileId;
  const saved: BrandingRead = {
    brandColour: body.brandColour,
    letterhead: body.letterhead,
    shades: body.brandColour === null ? null : compliantShades(body.brandColour),
    logoFileId: origin.logoFileId,
    changed: { at: '2026-10-25T10:00:00.000Z', by: { id: USER, name: 'Rajesh Kulkarni' } },
  };
  const { logoFileId: _stripped, changed: _unkept, ...asAnOldApi } = saved;
  origin.branding = origin.stripsLogo ? asAnOldApi : saved;
  send(res, req, 200, origin.branding);
}

async function answerComplete(req: IncomingMessage, res: ServerResponse) {
  const answer = origin.completes.shift() ?? { status: 200 };
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body ?? storedFile(NEW_LOGO));
}

/**
 * The reads every settings page with the cover shares — the session, the company, its pack, its
 * profile, its registrations and its branding; `false` when the request is none of them.
 */
export function answeredCompanyFacts(
  req: IncomingMessage,
  res: ServerResponse,
  bankName: string | null = null,
): boolean {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  const bankDetails =
    bankName === null
      ? null
      : {
          bankName,
          accountName: 'Suryodaya Solar Pvt Ltd',
          accountNumber: '50100234567812',
          bankRoutingIdentifier: 'HDFC0001234',
        };
  const reads: Record<string, unknown> = {
    '/auth/session': projection(),
    '/tenants/me': TENANT_READ,
    '/market-packs/IN': PACK_READ,
    '/settings/business-profile': { ...profileRead(), bankDetails },
    '/settings/tax-registrations': {
      registrations: [{ registrationType: 'IN_GST', value: '27AABCS1429P1ZQ' }],
    },
  };
  if (req.method === 'OPTIONS') send(res, req, 204);
  else if (path in reads) send(res, req, 200, reads[path]);
  else if (path === '/settings/branding' && req.method === 'GET')
    send(res, req, 200, origin.branding);
  else return false;
  return true;
}

function answer(req: IncomingMessage, res: ServerResponse) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (path === '/settings/branding' && req.method === 'PUT') return void answerSave(req, res);
  if (answeredCompanyFacts(req, res)) return;
  if (path === '/files' && req.method === 'POST') {
    origin.declares += 1;
    return void writeBodyOf(req, res).then((write) => {
      if (write === null) return;
      send(res, req, 201, {
        file: { ...storedFile(NEW_LOGO), uploadedAt: null },
        upload: {
          url: `${listening.url()}/store/${NEW_LOGO}`,
          method: 'PUT',
          headers: {},
          expiresAt: '2099-01-01T00:00:00.000Z',
        },
      });
    });
  }
  if (path.startsWith('/store/')) return send(res, req, 200);
  if (/^\/files\/[^/]+\/complete$/.test(path)) return void answerComplete(req, res);
  if (/^\/files\/[^/]+\/download-url$/.test(path)) {
    return send(res, req, 200, {
      url: `${listening.url()}/store/logo.png`,
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
  }
  send(res, req, 404, refusal('NOT_FOUND'));
}

const listening = listeningOrigin(answer);

afterEach(() => {
  cleanup();
  Object.assign(origin, {
    branding: structuredClone(NEVER_SAVED),
    logoFileId: null,
    saves: [],
    completes: [],
    stripsLogo: false,
    bodies: [],
    declares: 0,
  });
});

/** A company that saved a green with a logo on its profile. */
export function savedWithLogo() {
  origin.logoFileId = SAVED_LOGO;
  origin.branding = {
    brandColour: '#0D7A4F',
    letterhead: null,
    shades: compliantShades('#0D7A4F'),
    logoFileId: SAVED_LOGO,
    changed: { at: '2026-08-12T10:30:00.000Z', by: { id: USER, name: 'Rajesh Kulkarni' } },
  };
}

/** An image as an app hands one over; the device read it as `width` wide and `byteSize` long. */
export function anImage(width = 800, byteSize = 4, contentType = 'image/png'): ChosenPicture {
  return {
    contentType,
    byteSize,
    widthPx: width,
    bytes: new Uint8Array([1, 2, 3, 4]),
    picture: 'blob:logo',
  };
}

/** The Branding page, mounted in the real provider over the origin, its reads answered. */
export async function mounted() {
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(() => useBranding(), { wrapper });
  await waitFor(() => expect(view.result.current.status).toBe('ready'));
  await waitFor(() => expect(view.result.current.company).not.toBeNull());
  return view;
}
