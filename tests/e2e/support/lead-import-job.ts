import type { LeadImport, LeadImportRowWire } from '@heliogrid/contracts';
import { checksumSha256Of, LEAD_IMPORT_COLUMNS } from '@heliogrid/domain';
import type { Page, Route } from '@playwright/test';

/**
 * The lead import's server, answered in the page (`SCR-M02-05`): CI's web lane runs no object store
 * and no worker, so the file calls, the store and the import's routes answer here in the contract's
 * shapes, as the server's passes would — the file read, then judged, then run. What the passes
 * count and land is `apps/api/tests/crm/lead-import.test.ts`'s proof; this proves the screen.
 */

/** One row the spec writes into its file, and what the company already holds of its number. */
export interface SheetRow {
  readonly name: string;
  readonly phone: string;
  readonly city: string;
  readonly type: string;
  readonly bill: string;
  /** The company already has this number: the row is a duplicate by phone. */
  readonly known: boolean;
  readonly problem: 'unreadable_number' | 'missing_number' | null;
}

/** The file's own header row — a Hindi name header among them, as an old office sheet writes it. */
export const HEADERS = [
  'ग्राहक का नाम',
  'Mobile No.',
  'Town',
  'Category',
  'Monthly bill',
  'Remarks',
];

const JOB_ID = '7d1f0c2a-4b3e-4c5d-8e6f-0a1b2c3d4e5f';
const FILE_ID = '7d1f0c2a-4b3e-4c5d-8e6f-0a1b2c3d4e60';
const USER = '7d1f0c2a-4b3e-4c5d-8e6f-0a1b2c3d4e61';
const THE_STORE = 'http://localhost:9000/heliogrid-files-local/e2e-leads';
const AT = '2026-11-10T09:00:00.000Z';

const cellsOf = (row: SheetRow) => [row.name, row.phone, row.city, row.type, row.bill, ''];

/** The file the person chooses: a CSV of the header and every row. */
export function csvOf(rows: readonly SheetRow[]): Buffer {
  const lines = [HEADERS, ...rows.map(cellsOf)].map((cells) => cells.join(','));
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

function sheetOf(rows: readonly SheetRow[]): NonNullable<LeadImport['sheets']>[number] {
  return {
    name: 'Leads',
    rowCount: rows.length + 1,
    columnCount: HEADERS.length,
    topRows: [HEADERS, ...rows.slice(0, 9).map(cellsOf)],
  };
}

function wireOf(row: SheetRow, at: number, run: boolean): LeadImportRowWire {
  const verdict = row.problem !== null ? 'rejected' : row.known ? 'duplicate' : 'new';
  const ran = { new: 'landed', duplicate: 'skipped', rejected: 'rejected' } as const;
  return {
    rowNumber: at + 2,
    cells: { name: row.name, phone: row.phone, city: row.city, segment: row.type },
    phoneE164: row.problem === null ? `+91${row.phone.replace(/\D/g, '')}` : null,
    verdict,
    problems: row.problem === null ? [] : [row.problem],
    duplicateOf: row.known
      ? {
          kind: 'visible',
          leadId: JOB_ID,
          ownerName: 'Rajesh Jadhav',
          stage: 'qualified',
          lastContactAt: AT,
          customerId: FILE_ID,
          name: row.name,
          city: row.city,
        }
      : null,
    repeatsRow: null,
    result: run ? ran[verdict] : null,
    leadId: null,
  };
}

/** Where the job stands, moved on by each read as the server's passes would. */
type Phase = 'reading' | 'mapped' | 'matching' | 'previewed' | 'running' | 'completed';
const NEXT: Partial<Record<Phase, Phase>> = { reading: 'mapped', matching: 'previewed' };

/** The mapping the server proposes: the shared guess over the file's headers. */
function mappingOf(sheets: NonNullable<LeadImport['sheets']>): LeadImport['mapping'] {
  const guess = LEAD_IMPORT_COLUMNS.guessMapping(sheets);
  return guess === null ? null : { ...guess, columns: [...guess.columns] };
}

const json = (route: Route, status: number, body: unknown) => route.fulfill({ status, json: body });

/** The import as the page meets it: every run's body, in order, and the run's end, when the spec says. */
export interface AnsweredImport {
  readonly runs: unknown[];
  /** The run completes: the next read of the job is its report. */
  finish(): void;
}

/** Answers the file calls and the import's routes; a run goes on until the spec finishes it. */
export async function answerTheImport(
  page: Page,
  rows: readonly SheetRow[],
): Promise<AnsweredImport> {
  const sheets = [sheetOf(rows)];
  const counts = {
    rows: rows.length,
    duplicates: rows.filter((row) => row.known && row.problem === null).length,
    rejected: rows.filter((row) => row.problem !== null).length,
  };
  const runs: unknown[] = [];
  let phase: Phase = 'reading';
  const job = (): LeadImport => ({
    id: JOB_ID,
    status: phase,
    unreadableReason: null,
    fileName: 'Old leads 2024.csv',
    savedAt: null,
    startedBy: USER,
    createdAt: AT,
    file: { id: FILE_ID, contentType: 'text/csv', byteSize: 4096 },
    sheets: phase === 'reading' ? null : sheets,
    mapping: phase === 'reading' ? null : mappingOf(sheets),
    counts: ['previewed', 'running', 'completed'].includes(phase) ? counts : null,
    run:
      phase === 'running' || phase === 'completed'
        ? {
            duplicateChoice: 'skip',
            at: AT,
            by: USER,
            done: phase === 'running' ? 120 : rows.length,
            total: rows.length,
          }
        : null,
    results:
      phase === 'completed'
        ? {
            landed: rows.length - counts.duplicates - counts.rejected,
            logged: 0,
            skipped: counts.duplicates,
            rejected: counts.rejected,
          }
        : null,
  });
  await answerTheFiles(page, csvOf(rows));
  await page.route('**/lead-imports', (route) => json(route, 201, job()));
  await page.route(`**/lead-imports/${JOB_ID}`, (route) => {
    const answer = job();
    phase = NEXT[phase] ?? phase;
    return json(route, 200, answer);
  });
  await page.route(`**/lead-imports/${JOB_ID}/mapping`, (route) => {
    phase = 'matching';
    return json(route, 200, job());
  });
  await page.route(`**/lead-imports/${JOB_ID}/run`, (route) => {
    runs.push(route.request().postDataJSON());
    phase = 'running';
    return json(route, 200, job());
  });
  await page.route(new RegExp(`/lead-imports/${JOB_ID}/rows(\\?|$)`), (route) => {
    const ask = new URL(route.request().url()).searchParams;
    const run = phase === 'completed';
    const all = rows.map((row, at) => wireOf(row, at, run));
    const shown = all.filter(
      (row) =>
        (ask.get('verdict') ?? row.verdict) === row.verdict &&
        (ask.get('result') ?? row.result) === row.result,
    );
    const limit = Number(ask.get('limit') ?? 50);
    const pageNumber = Number(ask.get('page') ?? 1);
    const items = shown.slice((pageNumber - 1) * limit, pageNumber * limit);
    return json(route, 200, { items, totalCount: shown.length });
  });
  return {
    runs,
    finish: () => {
      phase = 'completed';
    },
  };
}

/** The file's declare, its bytes to the store, and its confirm — the store holds what was sent. */
async function answerTheFiles(page: Page, bytes: Buffer): Promise<void> {
  const stored = {
    id: FILE_ID,
    subjectKind: 'lead_import',
    subjectRef: USER,
    contentType: 'text/csv',
    byteSize: bytes.length,
    checksumSha256: checksumSha256Of(bytes),
  };
  const upload = {
    url: THE_STORE,
    method: 'PUT',
    headers: {},
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
  await page.route('**/files', (route) =>
    json(route, 201, { file: { ...stored, uploadedAt: null }, upload }),
  );
  await page.route(THE_STORE, (route) =>
    route.fulfill({
      status: route.request().method() === 'OPTIONS' ? 204 : 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'PUT',
      },
    }),
  );
  await page.route(`**/files/${FILE_ID}/complete`, (route) =>
    json(route, 200, { ...stored, uploadedAt: AT }),
  );
}
