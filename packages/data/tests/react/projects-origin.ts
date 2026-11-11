import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  IDEMPOTENCY_KEY_HEADER,
  type ProjectBoard,
  type ProjectDetail,
  type ProjectJob,
  type SessionProjection,
} from '@heliogrid/contracts';
import {
  can,
  composedHome,
  offersDoor,
  ROLE_PRESETS,
  type RolePreset,
  shellViewFor,
  showsInstallerJob,
} from '@heliogrid/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';
import {
  AT,
  aBoard,
  aProject,
  FILE_ID,
  LEAD_ID,
  PEOPLE,
  PREVIEW,
  PROJECT_ID,
  READER,
  storedFile,
  TENANT,
} from './projects-fixtures';

/**
 * The projects end to end through the real client (`packages/data/CLAUDE.md`, Done means): an
 * origin that keeps one project and one board, applies each act the way the api answers it, stores
 * a file through the file routes, and answers a case the way it needs — queued, held or dropped.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* By the shell's own rule, never by spelling: which presets open the projects door is F7-48's. */
const opensProjects = (role: RolePreset) => offersDoor(shellViewFor([role], null), 'projects');
function presetWhere(test: (role: RolePreset) => boolean): RolePreset {
  const found = ROLE_PRESETS.find(test);
  if (found === undefined) throw new Error('no preset fits');
  return found;
}
export const PROJECTS_ROLE = presetWhere(opensProjects);
export const NO_PROJECTS_ROLE = presetWhere((role) => !opensProjects(role));
/* One who reads the board but may move nothing on it (`M08-18`) — the matrix's rule, not a name. */
export const READS_PROJECTS_ROLE = presetWhere(
  (role) => opensProjects(role) && !can([role], 'projects.update_stages'),
);
/* Whose home draws the installer's job — domain's rule, never a spelled preset. */
const homeIsJob = (role: RolePreset) => showsInstallerJob(composedHome([role]));
export const JOB_HOME_ROLE = presetWhere(homeIsJob);
export const NO_JOB_HOME_ROLE = presetWhere((role) => !homeIsJob(role));

/** What the origin answers a write with: a status and body, or no answer at all. */
export type Answer = { status: number; body?: unknown } | 'drop';

interface Origin {
  roles: readonly RolePreset[];
  board: ProjectBoard;
  project: ProjectDetail;
  /** The project has left the reader's scope: every read of it answers 404. */
  gone: boolean;
  jobs: ProjectJob[];
  people: typeof PEOPLE;
  /**
   * The next answers to a write, in order, keyed by what it names: a project act by its route
   * after the id (`move`, `wait/end`, `files`), else `won`, `leads`, `declare` or `complete`.
   */
  answers: Map<string, Answer[]>;
  /** While set, every write waits for it — the act is out until the test lets it go. */
  gate: Promise<void> | null;
  /** Every request's method and path, in order. */
  sent: string[];
  writes: { path: string; body: unknown; key: string }[];
}

const START = (): Origin => ({
  roles: [PROJECTS_ROLE],
  board: aBoard([]),
  project: aProject(),
  gone: false,
  jobs: [],
  people: PEOPLE,
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

/** An act refused with domain's reason in its facts (`PROJECT_ACT_REFUSED`). */
export const actRefused = (reason: string) => ({
  error: { ...refusal('PROJECT_ACT_REFUSED').error, facts: { refusal: reason } },
});

/** How many times `path` was read. */
export const readsOf = (path: string) => origin.sent.filter((one) => one === `GET ${path}`).length;

/** The writes sent so far, by method and path, in order. */
export const writesSent = () => origin.sent.filter((request) => !request.startsWith('GET'));

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER.userId,
      phoneE164: '+919900000002',
      displayName: READER.name,
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: origin.roles, authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

/** The project after an act the api applied: a move walks the journey on, an undo walks it back. */
function acted(act: string, body: Record<string, unknown>): ProjectDetail {
  const project = structuredClone(origin.project);
  const to = act === 'dispatch' ? 'dispatched' : (body.to as string | undefined);
  if (to !== undefined) {
    const move = { from: project.stage, to, cause: 'person', proof: null, movedAt: AT };
    const entered = { enteredOn: project.today };
    project.journey.push({ ...move, ...entered, movedBy: READER });
    project.stage = to;
  } else if (act === 'undo') project.stage = project.journey.pop()?.from ?? project.stage;
  return project;
}

/** A write: the next answer queued for `key`, else what the route answers on success. */
async function answerWrite(
  req: IncomingMessage,
  res: ServerResponse,
  key: string,
  success: (body: unknown) => Answer,
) {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  const retryKey = String(req.headers[IDEMPOTENCY_KEY_HEADER] ?? '');
  origin.writes.push({ path, body: write.body, key: retryKey });
  if (origin.gate !== null) await origin.gate;
  const answer = origin.answers.get(key)?.shift() ?? success(write.body);
  if (answer === 'drop') return void req.socket.destroy();
  send(res, req, answer.status, answer.body);
}

function answerAct(req: IncomingMessage, res: ServerResponse, act: string) {
  void answerWrite(req, res, act, (body) => {
    origin.project = acted(act, (body ?? {}) as Record<string, unknown>);
    return { status: 200, body: origin.project };
  });
}

/** What a read of `path` answers now; `undefined` when `path` is none of the plain reads. */
function readAt(path: string): unknown {
  const reads: Record<string, unknown> = {
    '/auth/session': projection(),
    '/projects/board': origin.board,
    '/projects/people': origin.people,
    '/projects/jobs': origin.jobs,
    [`/projects/${PROJECT_ID}/handover`]: PREVIEW,
  };
  return reads[path];
}

/** A file's declare, the store's PUT of its bytes, and its complete; `false` for any other. */
function answeredFile(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/files') {
    const upload = {
      url: `${served.url()}/store/${FILE_ID}`,
      method: 'PUT',
      headers: {},
      expiresAt: '2099-01-01T00:00:00.000Z',
    };
    const declared = { file: storedFile(null), upload };
    void answerWrite(req, res, 'declare', () => ({ status: 201, body: declared }));
  } else if (path === `/files/${FILE_ID}/complete`) {
    void answerWrite(req, res, 'complete', () => ({ status: 200, body: storedFile(AT) }));
  } else if (path.startsWith('/store/')) {
    req.resume().on('end', () => send(res, req, 200));
  } else return false;
  return true;
}

const served = listeningOrigin((req, res) => {
  const path = new URL(req.url ?? '/', 'http://origin').pathname;
  if (req.method === 'OPTIONS') return send(res, req, 204);
  origin.sent.push(`${req.method} ${path}`);
  const read = req.method === 'GET' ? readAt(path) : undefined;
  if (read !== undefined) return send(res, req, 200, read);
  const act = /^\/projects\/[^/]+\/(.+)$/.exec(path)?.[1];
  if (act !== undefined && req.method === 'POST') return answerAct(req, res, act);
  if (path === `/projects/${PROJECT_ID}`) {
    if (origin.gone) return send(res, req, 404, refusal('NOT_FOUND'));
    return send(res, req, 200, origin.project);
  }
  if (path === `/leads/${LEAD_ID}/won`) {
    const made = { projectId: PROJECT_ID, number: 'PRJ-0042' };
    return void answerWrite(req, res, 'won', () => ({ status: 201, body: made }));
  }
  /* The referral's capture answers only what its case queued (`use-handover.test.ts`). */
  if (path === '/leads') {
    return void answerWrite(req, res, 'leads', () => ({ status: 500, body: refusal('INTERNAL') }));
  }
  if (!answeredFile(req, res, path)) send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, START());
});

/** A hook mounted in the real provider over the origin. */
export function mountedOver<P, T>(hook: (props: P) => T, initialProps?: P) {
  const layer = createDataLayer({ baseUrl: served.url(), language: () => 'en' });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  return renderHook(hook, { wrapper, initialProps });
}

/** Long enough for a read the hook would send to have reached the origin. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
