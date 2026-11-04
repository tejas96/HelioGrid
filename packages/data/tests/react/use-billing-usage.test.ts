// @vitest-environment happy-dom
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BillingUsage, SessionProjection } from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useUsageScreen } from '../../src/react/use-billing-usage';
import { homeOf } from './billing-home-fixtures';
import { listeningOrigin, send } from './origin-wire';

/**
 * The usage screen's reads through the real client (`SCR-M12-04`): the Owner reads the figures and
 * never the signals; anyone else the signals and the owners, never a figure; one meter's events
 * open, page and close.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const [OWNER_ROLE, , SALES] = ROLE_PRESETS;
const TENANT = '01a40000-0000-7000-8000-000000000011';
const STEP = { step: 'clear', pausesAt: null, resetsAt: null } as const;
const USAGE: BillingUsage = {
  standing: homeOf('active').standing,
  currencyCode: 'INR',
  priceListPublishedAt: '2026-04-01T00:00:00.000Z',
  cycle: { from: '2026-09-01T00:00:00.000Z', resetsAt: '2026-10-01T00:00:00.000Z' },
  proposals: { used: 0, limit: 300, usage: STEP },
  activeProjects: { used: 0, limit: 'unlimited', usage: STEP },
  designCeilingKw: 500,
  voice: { usedMinutes: 143, limit: 0, rate: '6.00', soFar: '858.00', usage: STEP },
  storage: { usedBytes: null, takenAt: null, limitGb: 50, usage: STEP },
  otpCodes: 4,
  extraCharges: { total: '858.00', billsOn: '2026-11-01T00:00:00.000Z' },
};
/** One more event than a page holds (50): `Show more` reads the second page. */
const EVENT_COUNT = 51;
const EVENTS = Array.from({ length: EVENT_COUNT }, (_, index) => ({
  id: `01a40000-0000-7000-8000-${String(index).padStart(12, '0')}`,
  occurredAt: new Date(Date.UTC(2026, 8, 1) + index * 60_000).toISOString(),
  quantity: 60,
  person: null,
}));

const origin = { roles: [OWNER_ROLE] as RolePreset[], requests: [] as string[] };

function answer(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, session());
  origin.requests.push(`${url.pathname}${url.search}`);
  if (url.pathname === '/billing/usage') return send(res, req, 200, USAGE);
  if (url.pathname === '/billing/usage/signals') return send(res, req, 200, { signals: [] });
  if (url.pathname === '/tenants/me/owners') {
    return send(res, req, 200, { owners: [{ name: 'Rajesh Sharma' }], more: 0 });
  }
  if (url.pathname === '/billing/usage/events') {
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const items = EVENTS.slice((page - 1) * limit, page * limit);
    return send(res, req, 200, { items, totalCount: EVENTS.length, cycle: USAGE.cycle });
  }
  send(res, req, 404, { error: { code: 'NOT_FOUND', message: 'none' } });
}

function session(): SessionProjection {
  return {
    actor: {
      userId: '01a40000-0000-7000-8000-000000000012',
      phoneE164: '+919999999901',
      displayName: 'Rajesh Sharma',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: origin.roles, authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

const listening = listeningOrigin(answer);

afterEach(() => {
  cleanup();
  origin.roles = [OWNER_ROLE];
  origin.requests = [];
});

async function mounted() {
  const told = { plans: 0 };
  const layer = createDataLayer({ baseUrl: listening.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(
    () =>
      useUsageScreen({
        toPlans: () => {
          told.plans += 1;
        },
      }),
    { wrapper },
  );
  await waitFor(() => expect(view.result.current.read.kind).toBe('ready'));
  return Object.assign(view, { told });
}

const called = (path: string) => origin.requests.filter((each) => each.startsWith(path));

describe('Usage — the page, through the real client', () => {
  it('an Owner reads the figures and never the signals; anyone else the signals, never a figure', async () => {
    const owner = await mounted();
    expect(owner.result.current.owner).toBe(true);
    expect(owner.result.current.read).toMatchObject({ kind: 'ready', value: { kind: 'owner' } });
    expect(called('/billing/usage/signals')).toHaveLength(0);
    owner.unmount();
    origin.requests = [];

    origin.roles = [SALES];
    const member = await mounted();
    expect(member.result.current.owner).toBe(false);
    await waitFor(() =>
      expect(member.result.current.read).toMatchObject({
        kind: 'ready',
        value: { kind: 'member', owners: { owners: [{ name: 'Rajesh Sharma' }] } },
      }),
    );
    expect(called('/billing/usage?')).toHaveLength(0);
    expect(origin.requests).not.toContain('/billing/usage');
  });

  it('opens one meter’s events, reads the next page on Show more, and closes', async () => {
    const view = await mounted();
    expect(view.result.current.ledger).toBeNull();
    expect(called('/billing/usage/events')).toHaveLength(0);

    act(() => view.result.current.openLedger('voice_minutes'));
    await waitFor(() => expect(view.result.current.ledger?.read.kind).toBe('ready'));
    expect(called('/billing/usage/events')[0]).toContain('meter=voice_minutes');
    expect(view.result.current.ledger?.more).toBe(true);

    act(() => view.result.current.moreEvents());
    await waitFor(() => expect(view.result.current.ledger?.more).toBe(false));
    const { ledger } = view.result.current;
    expect(ledger?.read.kind === 'ready' ? ledger.read.value : []).toHaveLength(EVENT_COUNT);
    expect(called('/billing/usage/events')[1]).toContain('page=2');

    act(() => view.result.current.closeLedger());
    expect(view.result.current.ledger).toBeNull();
  });

  it('the plans are the adapter’s way out', async () => {
    const view = await mounted();
    act(() => view.result.current.toPlans());
    expect(view.told.plans).toBe(1);
  });
});
