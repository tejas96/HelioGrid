// @vitest-environment happy-dom
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Member, SessionProjection } from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { useAssignRoles } from '../../src/react/use-assign-roles';
import { useTeam } from '../../src/react/use-team';

/**
 * Assign Roles' save, end to end through the real client (`packages/data/CLAUDE.md`, Done means):
 * the hook, the transport and the repository against an origin that answers each save the way a
 * case needs — what QA once drove by hand on three surfaces (`T-M01-013` AC-13 … AC-16, AC-25,
 * AC-29, AC-30).
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* By place in F2's order, never by spelling: a role name is the permission model's to write. */
const [OWNER_ROLE, , SALES, SURVEY, DESIGN, , , , , FINANCE] = ROLE_PRESETS;
const TENANT = '01a10000-0000-7000-8000-000000000001';
const OWNER_USER = '01a10000-0000-7000-8000-000000000002';
const member = (n: number, name: string, roles: RolePreset[]): Member => ({
  membershipId: `01a10000-0000-7000-8000-00000000010${n}`,
  userId: `01a10000-0000-7000-8000-00000000020${n}`,
  name,
  phoneE164: `+91999999990${n}`,
  roles,
  status: 'active',
  lastActiveAt: null,
});
const OWNER = { ...member(1, 'Rajesh Sharma', [OWNER_ROLE]), userId: OWNER_USER };
const VIKRAM = member(2, 'Vikram Deshpande', [SURVEY, DESIGN]);
const ISHA = member(3, 'Isha Rao', [SALES]);

/** Longer than the client's retries of a read that gets no answer. */
const READ_RETRIES_MS = 10_000;

/** What the origin answers a roles save with: a status and body, no answer at all, or later. */
type Answer = { status: number; body?: unknown; afterMs?: number } | 'drop';

interface Origin {
  roster: Member[];
  /** The next answers to `PUT …/roles`, in order; an exhausted list answers 200 with the set. */
  saves: Answer[];
  /** Read the roster with no answer, as a network that is down does. */
  dropReads: boolean;
  sessionReads: number;
  puts: number;
}

const origin: Origin = { roster: [], saves: [], dropReads: false, sessionReads: 0, puts: 0 };
let server: Server;
let baseUrl = '';

function send(res: ServerResponse, req: IncomingMessage, status: number, body?: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': req.headers.origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
    'access-control-allow-methods': 'GET, PUT, POST, OPTIONS',
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const refusal = (code: string) => ({ error: { code, message: code, requestId: 'test' } });

function projection(): SessionProjection {
  const roles = origin.roster.find((row) => row.userId === OWNER_USER)?.roles ?? [OWNER_ROLE];
  return {
    actor: {
      userId: OWNER_USER,
      phoneE164: OWNER.phoneE164,
      displayName: OWNER.name,
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: {
      tenantId: TENANT,
      roles: roles as [RolePreset, ...RolePreset[]],
      authorizationVersion: 1,
    },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

async function answerSave(req: IncomingMessage, res: ServerResponse, id: string) {
  origin.puts += 1;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const { roles } = JSON.parse(Buffer.concat(chunks).toString()) as { roles: RolePreset[] };
  const answer = origin.saves.shift() ?? { status: 200 };
  if (answer === 'drop') {
    req.socket.destroy();
    return;
  }
  if (answer.afterMs) await new Promise((resolve) => setTimeout(resolve, answer.afterMs));
  const row = origin.roster.find((m) => m.membershipId === id);
  if (answer.status === 200 && row) row.roles = roles;
  send(res, req, answer.status, answer.body ?? row);
}

/** The origin's routes: the session, the two roster reads, and the roles save. */
function answer(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') {
    origin.sessionReads += 1;
    return send(res, req, 200, projection());
  }
  if (url.pathname === '/tenants/me/members' || url.pathname === '/invitations') {
    return answerRead(req, res, url.pathname === '/invitations' ? [] : origin.roster);
  }
  const save = /^\/tenants\/me\/members\/([^/]+)\/roles$/.exec(url.pathname);
  if (save && req.method === 'PUT') return void answerSave(req, res, save[1] ?? '');
  send(res, req, 404, refusal('NOT_FOUND'));
}

function answerRead(req: IncomingMessage, res: ServerResponse, items: readonly Member[]) {
  if (origin.dropReads) return void req.socket.destroy();
  send(res, req, 200, { items, totalCount: items.length });
}

beforeAll(async () => {
  server = createServer(answer);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

afterEach(() => {
  cleanup();
  Object.assign(origin, { saves: [], dropReads: false, sessionReads: 0, puts: 0 });
});

/** Team and its editor, mounted in the real provider over the origin, the roster read. */
async function mounted() {
  origin.roster = [structuredClone(OWNER), structuredClone(VIKRAM), structuredClone(ISHA)];
  const layer = createDataLayer({ baseUrl, language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(
    () => {
      const team = useTeam('en');
      return { team, editor: useAssignRoles(team) };
    },
    { wrapper },
  );
  await waitFor(() => expect(view.result.current.team.load).toBe('ready'));
  return view;
}

type View = Awaited<ReturnType<typeof mounted>>;
const rowOf = (view: View, id: string) => {
  const row = view.result.current.team.roster.find((r) => r.id === id);
  if (!row) throw new Error(`no row ${id}`);
  return row;
};
function openAndTick(view: View, person: Member, tick: RolePreset) {
  act(() => view.result.current.editor.openerOf(rowOf(view, person.membershipId))?.());
  act(() => view.result.current.editor.pick([...person.roles, tick]));
}

describe('Assign Roles — every answer to a save, through the real client', () => {
  it('200: the sheet closes and the row reads the new set', async () => {
    const view = await mounted();
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    await waitFor(() => expect(rowOf(view, VIKRAM.membershipId).roles).toContain(FINANCE));
    expect(view.result.current.editor.refusal).toBeNull();
  });

  it('500: nothing changed, the ticks stay, Save is the retry', async () => {
    const view = await mounted();
    origin.saves = [{ status: 500, body: refusal('INTERNAL') }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind: 'failed' }));
    expect(view.result.current.editor.open).toBe(true);
    expect(view.result.current.editor.picked).toContain(FINANCE);
    expect(view.result.current.editor.saveOff).toBeNull();
  });

  it('409: gone, the person read again as deactivated, Save off', async () => {
    const view = await mounted();
    origin.saves = [{ status: 409, body: refusal('CONFLICT') }];
    openAndTick(view, VIKRAM, FINANCE);
    const vikram = origin.roster.find((m) => m.membershipId === VIKRAM.membershipId);
    if (vikram) vikram.status = 'deactivated';
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind: 'gone' }));
    expect(view.result.current.editor.person?.status).toBe('deactivated');
    expect(view.result.current.editor.saveOff).toBe('gone');
  });

  it.each([
    ['LAST_OWNER', 'last-owner'],
    ['OWN_ADMIN', 'own-admin'],
  ] as const)('422 %s: the sheet says why and keeps the ticks', async (code, kind) => {
    const view = await mounted();
    origin.saves = [{ status: 422, body: refusal(code) }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind }));
    expect(view.result.current.editor.picked).toContain(FINANCE);
  });

  it('403: the sheet closes and the person is read again', async () => {
    const view = await mounted();
    const before = origin.sessionReads;
    origin.saves = [{ status: 403, body: refusal('FORBIDDEN') }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    await waitFor(() => expect(origin.sessionReads).toBeGreaterThan(before));
  });

  it('no answer, and it landed (F8-36): read back, the sheet closes as on a 200', async () => {
    const view = await mounted();
    const vikram = origin.roster.find((m) => m.membershipId === VIKRAM.membershipId);
    origin.saves = ['drop'];
    openAndTick(view, VIKRAM, FINANCE);
    if (vikram) vikram.roles = [...VIKRAM.roles, FINANCE];
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    expect(view.result.current.editor.refusal).toBeNull();
  });

  it('no answer, and it did not land: nothing changed', async () => {
    const view = await mounted();
    origin.saves = ['drop'];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    await waitFor(() => expect(view.result.current.editor.refusal).toEqual({ kind: 'failed' }));
    expect(view.result.current.editor.open).toBe(true);
  });

  it(
    'no answer, and the list does not answer either: unconfirmed, by its failure',
    async () => {
      const view = await mounted();
      origin.saves = ['drop'];
      openAndTick(view, VIKRAM, FINANCE);
      origin.dropReads = true;
      act(() => view.result.current.editor.save());
      // The read retries twice on no answer before it gives up (packages/data/CLAUDE.md, Retry).
      await waitFor(
        () => expect(view.result.current.editor.refusal).toMatchObject({ kind: 'unconfirmed' }),
        { timeout: READ_RETRIES_MS },
      );
      expect(view.result.current.editor.saveOff).toBeNull();
    },
    READ_RETRIES_MS + 5_000,
  );

  it('a late answer lands only on the sheet it was sent from (AC-29)', async () => {
    const view = await mounted();
    origin.saves = [{ status: 500, body: refusal('INTERNAL'), afterMs: 300 }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => view.result.current.editor.save());
    act(() => view.result.current.editor.close());
    act(() => view.result.current.editor.openerOf(rowOf(view, ISHA.membershipId))?.());
    expect(view.result.current.editor.saving).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(view.result.current.editor.person?.id).toBe(ISHA.membershipId);
    expect(view.result.current.editor.refusal).toBeNull();
    expect(view.result.current.editor.saving).toBe(false);
  });

  it('a second tap while the save is out sends nothing more', async () => {
    const view = await mounted();
    origin.saves = [{ status: 200, afterMs: 200 }];
    openAndTick(view, VIKRAM, FINANCE);
    act(() => {
      view.result.current.editor.save();
      view.result.current.editor.save();
    });
    await waitFor(() => expect(view.result.current.editor.open).toBe(false));
    expect(origin.puts).toBe(1);
  });
});
