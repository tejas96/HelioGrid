import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LeadImport, LeadImportRowWire, SessionProjection } from '@heliogrid/contracts';
import { ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { cleanup, render } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { DataProvider } from '../../src/react/provider';
import { type LeadImportScreen, useLeadImportScreen } from '../../src/react/use-lead-import-screen';
import { listeningOrigin, refusal, send, writeBodyOf } from './origin-wire';

/**
 * The Lead Import Wizard end to end through the real client (`packages/data/CLAUDE.md`, Done
 * means): an origin that holds one import job and its rows, answers the mapping and the run, and
 * counts every read — the wizard mounted inside a provider that outlives it, so a test can leave
 * the screen and come back to the same device.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The owner: who imports leads (`F2.M02.import-leads`). */
export const [OWNER_ROLE, MANAGER_ROLE, EXECUTIVE_ROLE] = ROLE_PRESETS;
const TENANT = '01a50000-0000-7000-8000-000000000001';
const READER = '01a50000-0000-7000-8000-000000000002';
export const JOB_ID = '01a50000-0000-7000-8000-000000000301';

const HEADERS = ['ग्राहक का नाम', 'Mobile No.', 'Town', 'Remarks'];

/** A job read and previewed: 400 rows, 90 of them numbers the company already has. */
export const PREVIEWED: LeadImport = {
  id: JOB_ID,
  status: 'previewed',
  unreadableReason: null,
  fileName: 'Old leads 2024.xlsx',
  savedAt: null,
  startedBy: READER,
  createdAt: '2026-11-09T10:00:00.000Z',
  file: { id: '01a50000-0000-7000-8000-000000000401', contentType: 'text/csv', byteSize: 9120 },
  sheets: [
    {
      name: 'Leads',
      rowCount: 401,
      columnCount: 4,
      topRows: [HEADERS, ['Sachin Pawar', '98221 40318', 'Pune', 'hot'], ['Priya', '98220 14567']],
    },
  ],
  mapping: { sheet: 0, headerRow: 0, columns: ['name', 'phone', 'city', null] },
  counts: { rows: 400, duplicates: 90, rejected: 0 },
  run: null,
  results: null,
};

/** The same job once its run is out, then once it completed with two rows rejected. */
export const RUNNING: LeadImport = {
  ...PREVIEWED,
  status: 'running',
  run: {
    duplicateChoice: 'skip',
    at: '2026-11-09T10:05:00.000Z',
    by: READER,
    done: 120,
    total: 400,
  },
};
export const COMPLETED: LeadImport = {
  ...RUNNING,
  status: 'completed',
  counts: { rows: 400, duplicates: 90, rejected: 2 },
  run: { ...(RUNNING.run as NonNullable<LeadImport['run']>), done: 400 },
  results: { landed: 308, logged: 0, skipped: 90, rejected: 2 },
};

/** A rejected row, as the report lists it with its reason. */
export const REJECTED_ROW: LeadImportRowWire = {
  rowNumber: 18,
  cells: { name: 'रमेश पाटील', phone: '98220 1456' },
  phoneE164: null,
  verdict: 'rejected',
  problems: ['unreadable_number'],
  duplicateOf: null,
  repeatsRow: null,
  result: 'rejected',
  leadId: null,
};

/** A duplicate of a customer the reader may open: its three facts travel with it. */
export const DUPLICATE_ROW: LeadImportRowWire = {
  rowNumber: 3,
  cells: { name: 'Priya', phone: '98220 14567' },
  phoneE164: '+919822014567',
  verdict: 'duplicate',
  problems: [],
  duplicateOf: {
    kind: 'visible',
    leadId: '01a50000-0000-7000-8000-000000000501',
    ownerName: 'Rajesh Jadhav',
    stage: 'qualified',
    lastContactAt: '2026-11-05T10:00:00.000Z',
    customerId: '01a50000-0000-7000-8000-000000000601',
    name: 'Priya Sharma',
    city: 'Nashik',
  },
  repeatsRow: null,
  result: null,
  leadId: null,
};

interface Origin {
  job: LeadImport;
  rows: LeadImportRowWire[];
  roles: RolePreset[];
  /** Every write's method, path and body, in order. */
  writes: { path: string; body: unknown }[];
  /** Every row page asked, by its query. */
  rowAsks: string[];
  reads: number;
}

export const origin: Origin = {
  job: structuredClone(PREVIEWED),
  rows: [],
  roles: [OWNER_ROLE],
  writes: [],
  rowAsks: [],
  reads: 0,
};

function projection(): SessionProjection {
  return {
    actor: {
      userId: READER,
      phoneE164: '+919900000001',
      displayName: 'Asha Patil',
      interfaceLanguage: 'en',
      unitPreference: 'metric',
    },
    membership: { tenantId: TENANT, roles: origin.roles, authorizationVersion: 1 },
    expiry: { expiresAt: '2099-01-01T00:00:00.000Z', lastForegroundActivityAt: null },
  } as SessionProjection;
}

async function answerWrite(req: IncomingMessage, res: ServerResponse, path: string) {
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  origin.writes.push({ path, body: write.body });
  if (path.endsWith('/run')) origin.job = structuredClone(RUNNING);
  if (path.endsWith('/mapping')) origin.job = { ...origin.job, status: 'matching' };
  send(res, req, 200, origin.job);
}

const server = listeningOrigin((req, res) => {
  const url = new URL(req.url ?? '/', 'http://origin');
  if (req.method === 'OPTIONS') return send(res, req, 204);
  if (url.pathname === '/auth/session') return send(res, req, 200, projection());
  if (url.pathname === `/lead-imports/${JOB_ID}` && req.method === 'GET') {
    origin.reads += 1;
    return send(res, req, 200, origin.job);
  }
  if (url.pathname === `/lead-imports/${JOB_ID}/rows`) {
    origin.rowAsks.push(url.search);
    return send(res, req, 200, { items: origin.rows, totalCount: origin.rows.length });
  }
  if (req.method !== 'GET' && url.pathname.startsWith(`/lead-imports/${JOB_ID}/`)) {
    return void answerWrite(req, res, url.pathname);
  }
  send(res, req, 404, refusal('NOT_FOUND'));
});

afterEach(() => {
  cleanup();
  Object.assign(origin, {
    job: structuredClone(PREVIEWED),
    rows: [],
    roles: [OWNER_ROLE],
    writes: [],
    rowAsks: [],
    reads: 0,
  });
});

/**
 * The wizard on one device: a provider that stays while the screen comes and goes. `leave` takes
 * the screen away; `back` brings it again, at an address naming a job or none.
 */
export function mountedWizard(addressed: string | null) {
  const layer = createDataLayer({ baseUrl: server.url(), language: () => 'en' });
  const seen: { current: LeadImportScreen | null } = { current: null };
  function Wizard({ address }: { address: string | null }) {
    seen.current = useLeadImportScreen(address);
    return null;
  }
  const Device = ({ children }: { children?: ReactNode }) =>
    createElement(DataProvider, { layer, children });
  const host = (shown: boolean, address: string | null) =>
    createElement(Device, null, shown ? createElement(Wizard, { address }) : null);
  const view = render(host(true, addressed));
  const screen = () => {
    if (seen.current === null) throw new Error('the wizard is not on screen');
    return seen.current;
  };
  return {
    screen,
    leave() {
      view.rerender(host(false, null));
      seen.current = null;
    },
    back(address: string | null = null) {
      view.rerender(host(true, address));
    },
  };
}
