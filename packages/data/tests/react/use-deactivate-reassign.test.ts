// @vitest-environment happy-dom

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Assignee, LeadListRow, Member, SessionProjection } from '@heliogrid/contracts';
import { IN_FORMATS, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useTeamScreen } from '../../src/react/use-team-screen';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * SCR-M01-12's deactivate confirm with the person's open work (`SCR-M01-12`): their open leads counted,
 * one person chosen to take them, and on *Deactivate* every lead moves in bulk with the reason
 * before the person goes — and when the move fails, the person is not deactivated.
 */
const [OWNER_ROLE, , SALES] = ROLE_PRESETS;
const TENANT = '01a50000-0000-7000-8000-000000000001';
const member = (n: number, name: string, roles: RolePreset[]): Member => ({
  membershipId: `01a50000-0000-7000-8000-00000000010${n}`,
  userId: `01a50000-0000-7000-8000-00000000020${n}`,
  name,
  phoneE164: `+91999999990${n}`,
  roles,
  status: 'active',
  lastActiveAt: null,
});
const OWNER = member(1, 'Asha Patil', [OWNER_ROLE]);
const ANJALI = member(2, 'Anjali Kulkarni', [SALES]);
const RAJESH: Assignee = { userId: OWNER.userId, name: OWNER.name, openCount: 0, overdueCount: 0 };
const held = (n: number, name: string | null): LeadListRow => ({
  id: `01a50000-0000-7000-8000-00000000030${n}`,
  customerId: `01a50000-0000-7000-8000-00000000040${n}`,
  name,
  phoneE164: `+91982204120${n}`,
  city: null,
  segment: null,
  source: 'quick_add',
  stage: 'contacted',
  state: null,
  owner: { userId: ANJALI.userId, name: ANJALI.name },
  monthlyBill: null,
  value: null,
  createdAt: '2026-11-01T09:00:00.000Z',
  lastActivityAt: '2026-11-08T09:00:00.000Z',
  wakeOn: null,
  unansweredCalls: 0,
  nextTask: null,
});
const HELD = [held(1, 'Priya Sharma'), held(2, null)];
const REASON = 'Deactivated';

const origin = {
  writes: [] as { path: string; body: unknown }[],
  failMove: false,
};

/** The reads the Team page and the confirm make: the session, the roster, the people, her leads. */
function readAnswerOf(url: URL): unknown {
  if (url.pathname === '/auth/session') return projection();
  if (url.pathname === '/tenants/me/members') return { items: [OWNER, ANJALI], totalCount: 2 };
  if (url.pathname === '/invitations') return { items: [], totalCount: 0 };
  if (url.pathname === '/lead-assignees') {
    const anjali = { userId: ANJALI.userId, name: ANJALI.name, openCount: 2, overdueCount: 0 };
    return { items: [RAJESH, anjali] };
  }
  if (url.pathname === '/leads') {
    const mine = url.searchParams.get('ownerId') === ANJALI.userId ? HELD : [];
    const pipeline = { byStage: [{ stage: 'contacted', count: mine.length }], dormant: 0 };
    return { items: mine, totalCount: mine.length, currencyCode: 'INR', pipeline };
  }
  return null;
}

/** The two writes: the bulk move, refused when the case asks, and the deactivation. */
async function answerWrite(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.writes.push({ path, body: write.body });
  if (path !== '/leads/assign') return send(res, req, 200, { ...ANJALI, status: 'deactivated' });
  if (origin.failMove) return send(res, req, 500, refusal('INTERNAL'));
  const { leadIds } = write.body as { leadIds: string[] };
  send(res, req, 200, { results: leadIds.map((leadId) => ({ leadId, outcome: 'assigned' })) });
}

const server = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (req.method === 'POST') return void answerWrite(req, res, url.pathname);
  const answer = readAnswerOf(url);
  if (answer === null) return send(res, req, 404, refusal('NOT_FOUND'));
  send(res, req, 200, answer);
});

function projection(): SessionProjection {
  return {
    actor: {
      userId: OWNER.userId,
      phoneE164: OWNER.phoneE164,
      displayName: OWNER.name,
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: [OWNER_ROLE] as [RolePreset], authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

afterEach(() => {
  cleanup();
  Object.assign(origin, { writes: [], failMove: false });
});

/** The Team page with Anjali's deactivate confirm open, her open leads read. */
async function askingToDeactivateAnjali() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const layer = createDataLayer({ baseUrl: server.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const notes = {
    onActNote: () => {},
    onLeftRow: () => {},
    onRemoved: () => {},
    onUndoFailed: () => {},
    deactivatedReason: REASON,
  };
  const view = renderHook(() => useTeamScreen('en', IN_FORMATS, notes), { wrapper });
  await waitFor(() => expect(view.result.current.team.roster).toHaveLength(2));
  const row = view.result.current.team.roster.find((one) => one.id === ANJALI.membershipId);
  if (row === undefined) throw new Error('no row for Anjali');
  act(() => view.result.current.acts.start(row));
  await waitFor(() =>
    expect(view.result.current.reassign.open).toEqual({ kind: 'ready', value: 2 }),
  );
  return view;
}

describe('deactivate with open work (SCR-M01-12)', () => {
  it('counts the open leads and offers everyone but the person going', async () => {
    const view = await askingToDeactivateAnjali();
    await waitFor(() => expect(view.result.current.reassign.peopleRead.kind).toBe('ready'));
    expect(view.result.current.reassign.people.map((person) => person.userId)).toEqual([
      OWNER.userId,
    ]);
  });

  it('moves every open lead in one bulk assign with the reason, then deactivates', async () => {
    const view = await askingToDeactivateAnjali();
    await waitFor(() => expect(view.result.current.reassign.people).toHaveLength(1));
    act(() => view.result.current.reassign.choose());
    act(() => view.result.current.reassign.pick(OWNER.userId));
    expect(view.result.current.reassign.to?.userId).toBe(OWNER.userId);
    act(() => view.result.current.acts.go());
    await waitFor(() => expect(origin.writes).toHaveLength(2));
    expect(origin.writes).toEqual([
      {
        path: '/leads/assign',
        body: { leadIds: HELD.map((one) => one.id), assigneeId: OWNER.userId, reason: REASON },
      },
      { path: `/tenants/me/members/${ANJALI.membershipId}/deactivate`, body: undefined },
    ]);
  });

  it('a move that fails sends no deactivation', async () => {
    const view = await askingToDeactivateAnjali();
    await waitFor(() => expect(view.result.current.reassign.people).toHaveLength(1));
    act(() => view.result.current.reassign.pick(OWNER.userId));
    origin.failMove = true;
    act(() => view.result.current.acts.go());
    await waitFor(() => expect(view.result.current.acts.busy).toBe(false));
    expect(origin.writes.map((write) => write.path)).toEqual(['/leads/assign']);
  });

  it('with no one chosen, the person is deactivated and their leads stay', async () => {
    const view = await askingToDeactivateAnjali();
    act(() => view.result.current.acts.go());
    await waitFor(() => expect(origin.writes).toHaveLength(1));
    expect(origin.writes[0]?.path).toBe(`/tenants/me/members/${ANJALI.membershipId}/deactivate`);
  });
});
