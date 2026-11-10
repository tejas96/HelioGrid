import {
  type DeclaredFile,
  type LeadImport,
  type LeadImportRowWire,
  OBJECT_STORE,
  type Paginated,
} from '@heliogrid/contracts';
import { activity, customer, lead } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { CrmLeadImportService } from '../../src/modules/crm/crm.lead-import.service';
import { CrmLeadImportPreviewService } from '../../src/modules/crm/crm.lead-import-preview.service';
import { CrmLeadImportRunService } from '../../src/modules/crm/crm.lead-import-run.service';
import {
  type MemoryObjectStore,
  sha256Of,
} from '../../src/modules/file/internal/object-store.memory';
import { aPhone } from '../support/fixture';
import { type Caller, type CrmWorld, retryKey } from './support';

/*
 * A lead import driven as a person and the step host drive it: the spreadsheet stored through the
 * files routes, each route called over HTTP as the member, and each workflow step called on the
 * api's own services exactly as `crm.lead-import.activities.ts` registers them — no Temporal.
 */

export const CSV = 'text/csv' as const;
export const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' as const;
type SheetType = typeof CSV | typeof XLSX;

/** `count` numbers no other case and no other row of this run holds. */
export function freshPhones(count: number): string[] {
  const phones = new Set<string>();
  while (phones.size < count) phones.add(aPhone());
  return [...phones];
}

/** A CSV of these rows, a cell holding a comma quoted. */
export function aCsvOf(rows: readonly (readonly string[])[]): Uint8Array {
  const cell = (text: string) => (/[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  return new TextEncoder().encode(rows.map((row) => row.map(cell).join(',')).join('\n'));
}

/** An `.xlsx` of one sheet holding these rows. */
export async function anXlsxOf(rows: readonly (readonly string[])[]): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Leads').addRows(rows.map((row) => [...row]));
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

/** The spreadsheet stored against the company for the lead import, as the wizard's upload does. */
export async function aStoredSheet(
  world: CrmWorld,
  caller: Caller,
  tenantId: string,
  bytes: Uint8Array,
  contentType: SheetType = CSV,
): Promise<string> {
  const declared = await caller.call<DeclaredFile>(
    'POST',
    '/files',
    {
      subjectKind: 'lead_import',
      subjectRef: tenantId,
      contentType,
      byteSize: bytes.length,
      checksumSha256: sha256Of(bytes),
    },
    retryKey(),
  );
  if (declared.status !== HttpStatus.CREATED) {
    throw new Error(`declare: got ${declared.status} ${JSON.stringify(declared.body)}`);
  }
  const store = world.http.app.get<MemoryObjectStore>(OBJECT_STORE);
  if (!store.receive(declared.body.upload?.url ?? '', bytes)) throw new Error('upload refused');
  const done = await caller.call('POST', `/files/${declared.body.file.id}/complete`);
  if (done.status !== HttpStatus.OK) throw new Error(`complete: got ${done.status}`);
  return declared.body.file.id;
}

/** What one test needs of an import: its id and the step input the workflow would send. */
export interface Started {
  readonly id: string;
  readonly fileId: string;
  readonly step: { readonly tenantId: string; readonly jobId: string };
}

/** The spreadsheet stored, the import started on it, and the read step run. */
export async function anImportOf(
  world: CrmWorld,
  caller: Caller,
  tenantId: string,
  bytes: Uint8Array,
  contentType: SheetType = CSV,
): Promise<Started> {
  const fileId = await aStoredSheet(world, caller, tenantId, bytes, contentType);
  return startedAndRead(world, caller, tenantId, fileId);
}

/** `POST /lead-imports`, then the read step. */
export async function startedAndRead(
  world: CrmWorld,
  caller: Caller,
  tenantId: string,
  fileId: string,
): Promise<Started> {
  const reply = await caller.call<LeadImport>(
    'POST',
    '/lead-imports',
    { fileId, fileName: 'old-leads.csv', savedAt: null },
    retryKey(),
  );
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`start: got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  const step = { tenantId, jobId: reply.body.id };
  await world.http.app.get(CrmLeadImportService).readFile(step, Date.now());
  return { id: reply.body.id, fileId, step };
}

/** `PUT /lead-imports/:id/mapping`, then the preview pass; the job as it then reads. */
export async function mappedAndPreviewed(
  world: CrmWorld,
  caller: Caller,
  started: Started,
  columns: readonly (string | null)[],
  headerRow = 0,
): Promise<LeadImport> {
  const mapping = { sheet: 0, headerRow, columns };
  const mapped = await caller.call('PUT', `/lead-imports/${started.id}/mapping`, mapping);
  if (mapped.status !== HttpStatus.OK) {
    throw new Error(`map: got ${mapped.status} ${JSON.stringify(mapped.body)}`);
  }
  await world.http.app.get(CrmLeadImportPreviewService).matchRows(started.step, Date.now());
  return (await caller.call<LeadImport>('GET', `/lead-imports/${started.id}`)).body;
}

/** `POST /lead-imports/:id/run` with the body given, then the run step batch after batch. */
export async function ranToTheEnd(
  world: CrmWorld,
  caller: Caller,
  started: Started,
  body: Record<string, unknown> = {},
): Promise<LeadImport> {
  const run = await caller.call('POST', `/lead-imports/${started.id}/run`, body);
  if (run.status !== HttpStatus.OK) throw new Error(`run: got ${run.status}`);
  const runs = world.http.app.get(CrmLeadImportRunService);
  for (;;) {
    const applied = await runs.applyRows(started.step, Date.now());
    if (applied.status !== 'running') break;
  }
  return (await caller.call<LeadImport>('GET', `/lead-imports/${started.id}`)).body;
}

/** Every row of the preview or the report, narrowed as the query says. */
export async function rowsOf(
  caller: Caller,
  id: string,
  narrowed = '',
): Promise<LeadImportRowWire[]> {
  const rows: LeadImportRowWire[] = [];
  for (let page = 1; ; page += 1) {
    const reply = await caller.call<Paginated<LeadImportRowWire>>(
      'GET',
      `/lead-imports/${id}/rows?limit=100&page=${page}${narrowed}`,
    );
    if (reply.status !== HttpStatus.OK) throw new Error(`rows: got ${reply.status}`);
    rows.push(...reply.body.items);
    if (rows.length >= reply.body.totalCount) return rows;
  }
}

/** The customers of a company holding any of these numbers, on the admin path. */
export function customersWith(world: CrmWorld, tenantId: string, phones: readonly string[]) {
  return world.pools.admin.db
    .select({ id: customer.id, phoneE164: customer.phoneE164 })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), inArray(customer.phoneE164, [...phones])));
}

/** The leads of a company's customers holding any of these numbers, on the admin path. */
export function leadsWith(world: CrmWorld, tenantId: string, phones: readonly string[]) {
  return world.pools.admin.db
    .select({
      id: lead.id,
      source: lead.source,
      owner: lead.ownerUserId,
      stage: lead.stage,
      bill: lead.monthlyBillMinor,
      phoneE164: customer.phoneE164,
    })
    .from(lead)
    .innerJoin(customer, eq(customer.id, lead.customerId))
    .where(and(eq(lead.tenantId, tenantId), inArray(customer.phoneE164, [...phones])));
}

/** The enquiries an import logged on one lead, on the admin path. */
export async function importEnquiriesOn(world: CrmWorld, leadId: string) {
  const entries = await world.pools.admin.db
    .select({ kind: activity.kind, body: activity.body })
    .from(activity)
    .where(and(eq(activity.leadId, leadId), eq(activity.kind, 'enquiry')));
  return entries.filter((entry) => (entry.body as { channel?: string }).channel === 'import');
}
