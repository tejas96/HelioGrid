import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Member, SessionProjection } from '@heliogrid/contracts';
import { type AssignRolesRefusal, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import {
  type RolesRemoval,
  type RolesRemovalNotes,
  useAssignRoles,
} from '../../src/react/use-assign-roles';
import { useTeam } from '../../src/react/use-team';

/**
 * Assign Roles end to end through the real client (`packages/data/CLAUDE.md`, Done means): the hook,
 * the transport and the repository against an origin that answers each roles save the way a case
 * needs. The tests that import this share one origin, mounted in the real provider.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* By place in F2's order, never by spelling: a role name is the permission model's to write. */
export const [OWNER_ROLE, , SALES, SURVEY, DESIGN, , , , , FINANCE] = ROLE_PRESETS;
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
export const OWNER = { ...member(1, 'Rajesh Sharma', [OWNER_ROLE]), userId: OWNER_USER };
export const VIKRAM = member(2, 'Vikram Deshpande', [SURVEY, DESIGN]);
export const ISHA = member(3, 'Isha Rao', [SALES]);

/** Longer than the client's retries of a read that gets no answer. */
export const READ_RETRIES_MS = 10_000;

/** What the origin answers a roles save with: a status and body, no answer at all, or later. */
export type Answer = { status: number; body?: unknown; afterMs?: number } | 'drop';

interface Origin {
  roster: Member[];
  /** The next answers to `PUT …/roles`, in order; an exhausted list answers 200 with the set. */
  saves: Answer[];
  /** Read the roster with no answer, as a network that is down does. */
  dropReads: boolean;
  sessionReads: number;
  puts: number;
}

export const origin: Origin = { roster: [], saves: [], dropReads: false, sessionReads: 0, puts: 0 };
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

export const refusal = (code: string) => ({ error: { code, message: code, requestId: 'test' } });

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

/** What the editor told the screen: each landed removal with its undo, and each undo that failed. */
export interface Told {
  removed: { removal: RolesRemoval; undo: () => void }[];
  undoFailed: { refusal: AssignRolesRefusal; removal: RolesRemoval }[];
}

/** Team and its editor, mounted in the real provider over the origin, the roster read. */
export async function mounted() {
  const told: Told = { removed: [], undoFailed: [] };
  const notes: RolesRemovalNotes = {
    onRemoved: (removal, undo) => told.removed.push({ removal, undo }),
    onUndoFailed: (refusal, removal) => told.undoFailed.push({ refusal, removal }),
  };
  origin.roster = [structuredClone(OWNER), structuredClone(VIKRAM), structuredClone(ISHA)];
  const layer = createDataLayer({ baseUrl, language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const view = renderHook(
    () => {
      const team = useTeam('en');
      return { team, editor: useAssignRoles(team, notes) };
    },
    { wrapper },
  );
  await waitFor(() => expect(view.result.current.team.load).toBe('ready'));
  return Object.assign(view, { told });
}

export type View = Awaited<ReturnType<typeof mounted>>;
export const rowOf = (view: View, id: string) => {
  const row = view.result.current.team.roster.find((r) => r.id === id);
  if (!row) throw new Error(`no row ${id}`);
  return row;
};
export function openAndTick(view: View, person: Member, tick: RolePreset) {
  act(() => view.result.current.editor.openerOf(rowOf(view, person.membershipId))?.());
  act(() => view.result.current.editor.pick([...person.roles, tick]));
}
