import type { LeadImport } from '@heliogrid/contracts';
import { orchestrationOutbox } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TemporalConnection } from '../../src/common/temporal/temporal.client';
import { TEMPORAL_CLIENT } from '../../src/common/temporal/temporal.tokens';
import { CrmLeadImportRunService } from '../../src/modules/crm/crm.lead-import-run.service';
import { skipWithoutDatabase } from '../support/fixture';
import { aRecordingTemporal } from '../support/temporal';
import {
  aCsvOf,
  anImportOf,
  anXlsxOf,
  customersWith,
  freshPhones,
  importEnquiriesOn,
  leadsWith,
  mappedAndPreviewed,
  ranToTheEnd,
  rowsOf,
  XLSX,
} from './lead-import-support';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  noticesOf,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * The lead import (`M02-18`…`M02-21`, `T-M02-005`): a stored spreadsheet read, its columns guessed
 * from English, Hindi or Marathi headers, a preview that counts rows and duplicates by phone before
 * anything lands, a run that skips duplicates unless told to log them as enquiries — never a second
 * customer — and a report naming every rejected row and the count that landed. Owner and Sales
 * Manager only.
 */

const here = aStaffedCompany('Import EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rajesh: [preset.sales_executive],
});
const elsewhere = aStaffedCompany('Other Import EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'LEAD IMPORT PROOF',
  'The lead import is UNPROVEN on the wire in this run.',
);

/** Ninety captures and a 400-row pass take seconds, not the default five. */
const HEAVY = 60_000;
const recording = aRecordingTemporal();

const FILE_ROWS = 400;
const KNOWN_PHONES = 90;
/** The rows one run step takes (`crm.lead-import-run.service.ts`), and a part step's worth more. */
const ONE_STEP = 100;
const PART_STEP = 50;
/** `3,500` and `₹ 4,200` in paise. */
const BILL_3500 = 350_000;
const BILL_4200 = 420_000;

const HEADER = ['Name', 'Mobile No', 'City', 'Type', 'Monthly bill'];
const COLUMNS = ['name', 'phone', 'city', 'segment', 'monthly_bill'];
/** A number as an old sheet writes it, with no country code: `98450 27746`. */
const national = (phoneE164: string) => phoneE164.replace(/^\+91(\d{5})/, '$1 ');
const aRow = (phone: string, name = 'Asha', bill = '3,500') => [name, phone, 'Pune', 'Home', bill];
const csvOf = (rows: readonly (readonly string[])[]) => aCsvOf([HEADER, ...rows]);

describe.skipIf(skip)('the lead import, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const tenantId = here.company.tenantId;
  const manager = () => world.as(here.members.manager);
  const imported = (bytes: Uint8Array) => anImportOf(world, manager(), tenantId, bytes);
  const readOf = async (id: string) =>
    (await manager().call<LeadImport>('GET', `/lead-imports/${id}`)).body;

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere]);
    // Each step is driven here as the step host drives it; a handoff reaches a recording Temporal.
    const temporal = world.http.app.get<TemporalConnection>(TEMPORAL_CLIENT);
    vi.spyOn(temporal, 'client').mockImplementation(() => recording.connection.client());
  }, HEAVY);

  afterAll(async () => {
    await world.close();
  }, HEAVY);

  it(
    'a 400-row file with 90 known phones previews 400 rows and 90 duplicates',
    async () => {
      const known = freshPhones(KNOWN_PHONES);
      for (const phone of known) await captured(manager(), aCapture(phone));
      // Half the known numbers written the way an old sheet writes them: one identity either way.
      const written = known.map((phone, i) => (i % 2 === 0 ? national(phone) : phone));
      const phones = [...written, ...freshPhones(FILE_ROWS - KNOWN_PHONES)];
      const started = await imported(csvOf(phones.map((phone) => aRow(phone))));
      const previewed = await mappedAndPreviewed(world, manager(), started, COLUMNS);
      expect(previewed.status).toBe('previewed');
      expect(previewed.counts).toEqual({ rows: FILE_ROWS, duplicates: KNOWN_PHONES, rejected: 0 });
      const duplicates = await rowsOf(manager(), started.id, '&verdict=duplicate');
      expect(duplicates).toHaveLength(KNOWN_PHONES);
      expect(duplicates.every((row) => row.duplicateOf?.kind === 'visible')).toBe(true);
    },
    HEAVY,
  );

  it(
    'skip is the default, log as enquiry appends, and no imported row creates a duplicate',
    async () => {
      const [priya, ravi, newPhone] = [aPhone(), aPhone(), aPhone()];
      const owned: string[] = [];
      for (const phone of [priya, ravi]) {
        const existing = await captured(manager(), aCapture(phone));
        await ownLead(world, existing.lead.id, here.people.rajesh.userId);
        owned.push(existing.lead.id);
      }
      const file = () => csvOf([aRow(priya), aRow(ravi), aRow(newPhone), aRow(national(newPhone))]);

      const first = await imported(file());
      const previewed = await mappedAndPreviewed(world, manager(), first, COLUMNS);
      expect(previewed.counts).toEqual({ rows: 4, duplicates: 3, rejected: 0 });
      // Rajesh's leads lie outside the manager's scope: the sheet's three facts only (`M02-08`).
      const duplicates = await rowsOf(manager(), first.id, '&verdict=duplicate');
      const [firstOfNew] = await rowsOf(manager(), first.id, '&verdict=new');
      expect(duplicates.map((row) => [row.duplicateOf?.kind ?? null, row.repeatsRow])).toEqual([
        ['out_of_scope', null],
        ['out_of_scope', null],
        [null, firstOfNew?.rowNumber],
      ]);
      expect(duplicates[0]?.duplicateOf).toMatchObject({ ownerName: here.people.rajesh.name });
      // No choice sent: every duplicate is skipped, the in-file repeat after its first row landed.
      const skipped = await ranToTheEnd(world, manager(), first);
      expect(skipped.run?.duplicateChoice).toBe('skip');
      expect(skipped.results).toEqual({ landed: 1, logged: 0, skipped: 3, rejected: 0 });
      for (const leadId of owned) expect(await importEnquiriesOn(world, leadId)).toHaveLength(0);

      const second = await imported(file());
      await mappedAndPreviewed(world, manager(), second, COLUMNS);
      const choice = { duplicateChoice: 'log_enquiry' };
      const logged = await ranToTheEnd(world, manager(), second, choice);
      expect(logged.results).toEqual({ landed: 0, logged: 4, skipped: 0, rejected: 0 });
      for (const leadId of owned) expect(await importEnquiriesOn(world, leadId)).toHaveLength(1);
      const [landed] = await leadsWith(world, tenantId, [newPhone]);
      expect(landed).toMatchObject({
        source: 'import',
        owner: null,
        stage: 'new',
        bill: BILL_3500,
      });
      expect(await importEnquiriesOn(world, landed?.id ?? '')).toHaveLength(2);
      // Rajesh is told once for his two leads, and the notice opens the first of them — a lead he
      // holds, never the import, which a rep without `crm.import_leads` may not open; the
      // unassigned lead goes to the EPC Owner, named.
      const [firstOwned] = owned;
      const toRajesh = await noticesOf(world, here.people.rajesh.userId, firstOwned ?? '');
      expect(toRajesh.map((notice) => [notice.subjectKind, notice.title])).toEqual([
        ['lead', '2 new enquiries on your leads'],
      ]);
      expect(await noticesOf(world, here.people.rajesh.userId, second.id)).toEqual([]);
      expect(await noticesOf(world, here.people.owner.userId, landed?.id ?? '')).toHaveLength(1);

      const held = await customersWith(world, tenantId, [priya, ravi, newPhone]);
      expect(held.map((one) => one.phoneE164).sort()).toEqual([priya, ravi, newPhone].sort());
      const keepBoth = { duplicateChoice: 'keep_both' };
      const refused = await manager().call('POST', `/lead-imports/${second.id}/run`, keepBoth);
      expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
    },
    HEAVY,
  );

  it(
    'the report lists every rejected row with its reason and the count that landed',
    async () => {
      const [good, badBill, badType] = [aPhone(), aPhone(), aPhone()];
      const started = await imported(
        csvOf([
          aRow(good),
          aRow('', 'No Number'),
          aRow('12345', 'Short Number'),
          aRow(badBill, 'Bad Bill', 'about two thousand'),
          ['Bad Type', badType, 'Pune', 'Spaceship', '2000'],
        ]),
      );
      await mappedAndPreviewed(world, manager(), started, COLUMNS);
      const report = await ranToTheEnd(world, manager(), started);
      expect(report.results).toEqual({ landed: 1, logged: 0, skipped: 0, rejected: 4 });
      const rejected = await rowsOf(manager(), started.id, '&result=rejected');
      expect(rejected.map((row) => [row.cells.name, row.problems])).toEqual([
        ['No Number', ['missing_number']],
        ['Short Number', ['unreadable_number']],
        ['Bad Bill', ['malformed_row']],
        ['Bad Type', ['malformed_row']],
      ]);
      expect(await leadsWith(world, tenantId, [badBill, badType])).toHaveLength(0);

      // A run that fails part way: the rows it landed stay, the rest are named as not written.
      const many = freshPhones(ONE_STEP + PART_STEP);
      const cut = await imported(csvOf(many.map((phone) => aRow(phone))));
      await mappedAndPreviewed(world, manager(), cut, COLUMNS);
      await manager().call('POST', `/lead-imports/${cut.id}/run`, {});
      const runs = world.http.app.get(CrmLeadImportRunService);
      expect(await runs.applyRows(cut.step, Date.now())).toEqual({ status: 'running' });
      expect(await runs.endRun(cut.step, Date.now())).toEqual({ status: 'completed' });
      const ended = await readOf(cut.id);
      expect(ended.results).toEqual({
        landed: ONE_STEP,
        logged: 0,
        skipped: 0,
        rejected: PART_STEP,
      });
      expect(ended.run).toMatchObject({ done: many.length, total: many.length });
      const notWritten = await rowsOf(manager(), cut.id, '&result=rejected');
      expect(new Set(notWritten.flatMap((row) => row.problems))).toEqual(new Set(['not_written']));
      expect(await leadsWith(world, tenantId, many)).toHaveLength(ONE_STEP);
    },
    HEAVY,
  );

  it(
    'no lead exists before the import runs',
    async () => {
      const phones = [aPhone(), aPhone()];
      const hindi = ['नाम', 'मोबाइल नंबर', 'शहर', 'बिजली बिल'];
      const sheet = [hindi, ...phones.map((phone) => ['आशा', phone, 'नाशिक', '₹ 4,200'])];
      const bytes = await anXlsxOf(sheet);
      const started = await anImportOf(world, manager(), tenantId, bytes, XLSX);
      const read = await readOf(started.id);
      expect(read.status).toBe('mapped');
      const guessed = ['name', 'phone', 'city', 'monthly_bill'];
      expect(read.mapping).toEqual({ sheet: 0, headerRow: 0, columns: guessed });
      const previewed = await mappedAndPreviewed(world, manager(), started, guessed);
      expect(previewed.counts).toEqual({ rows: 2, duplicates: 0, rejected: 0 });
      expect(await rowsOf(manager(), started.id, '&verdict=new')).toHaveLength(2);
      expect(await customersWith(world, tenantId, phones)).toHaveLength(0);

      // The same mapping sent again starts no second pass and moves nothing.
      const events = () =>
        world.pools.admin.db
          .select({ count: sql<number>`count(*)::int` })
          .from(orchestrationOutbox)
          .where(
            and(
              eq(orchestrationOutbox.tenantId, tenantId),
              sql`${orchestrationOutbox.payload} ->> 'jobId' = ${started.id}`,
            ),
          );
      const before = await events();
      const path = `/lead-imports/${started.id}/mapping`;
      const again = await manager().call<LeadImport>('PUT', path, read.mapping);
      expect(again.body.status).toBe('previewed');
      expect(await events()).toEqual(before);

      const ran = await ranToTheEnd(world, manager(), started);
      expect(ran.results).toMatchObject({ landed: 2 });
      const landed = await leadsWith(world, tenantId, phones);
      expect(landed.map((one) => one.bill)).toEqual([BILL_4200, BILL_4200]);
    },
    HEAVY,
  );

  it(
    'a sales executive is refused every import route, and another company’s is not found',
    async () => {
      const started = await imported(csvOf([aRow(aPhone())]));
      const rajesh = world.as(here.members.rajesh);
      const base = `/lead-imports/${started.id}`;
      const doors: readonly [string, string, unknown][] = [
        ['POST', '/lead-imports', { fileId: started.fileId, fileName: 'x.csv', savedAt: null }],
        ['GET', base, undefined],
        ['PUT', `${base}/mapping`, { sheet: 0, headerRow: 0, columns: COLUMNS }],
        ['GET', `${base}/rows`, undefined],
        ['POST', `${base}/run`, {}],
      ];
      for (const [method, path, body] of doors) {
        const reply = await rajesh.call(method, path, body);
        expect(reply.status, `${method} ${path}`).toBe(HttpStatus.FORBIDDEN);
      }
      const stranger = world.as(elsewhere.members.owner);
      expect((await stranger.call('GET', base)).status).toBe(HttpStatus.NOT_FOUND);
    },
    HEAVY,
  );
});
