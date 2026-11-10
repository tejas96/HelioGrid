import type { LeadImport } from '@heliogrid/contracts';
import { leadImportRow } from '@heliogrid/db';
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
  freshPhones,
  leadsWith,
  mappedAndPreviewed,
} from './lead-import-support';
import { aStaffedCompany, type CrmWorld, openCrmWorld } from './support';

/**
 * A row the run cannot write fails alone (`M02-21`): it is rejected as not written, and every
 * other row of its batch lands — one bad row never fails the batch, nor the rows after it.
 */

const here = aStaffedCompany('Import Row Failure EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'LEAD IMPORT ROW FAILURE PROOF',
  'A failing import row is UNPROVEN in this run.',
);

const recording = aRecordingTemporal();
const HEADER = ['Name', 'Mobile No', 'City'];
const COLUMNS = ['name', 'phone', 'city'];
/** The row planted to fail: the second of the file, the first data row being 1. */
const FAILING_ROW = 2;
/** Rows in the file: the failing one between two that land. */
const FILE_ROWS = 3;

describe.skipIf(skip)('a failing lead import row, against a migrated database', () => {
  let world: CrmWorld;
  const tenantId = here.company.tenantId;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
    // Each step is driven here as the step host drives it; a handoff reaches a recording Temporal.
    const temporal = world.http.app.get<TemporalConnection>(TEMPORAL_CLIENT);
    vi.spyOn(temporal, 'client').mockImplementation(() => recording.connection.client());
  });

  afterAll(async () => {
    await world.close();
  });

  it('a row that cannot be written is rejected alone and the rest of its batch lands', async () => {
    const phones = freshPhones(FILE_ROWS);
    const csv = aCsvOf([HEADER, ...phones.map((phone, at) => [`Lead ${at}`, phone, 'Pune'])]);
    const started = await anImportOf(world, owner(), tenantId, csv);
    await mappedAndPreviewed(world, owner(), started, COLUMNS);
    const [failing] = await world.pools.admin.db
      .select({ rowNumber: leadImportRow.rowNumber })
      .from(leadImportRow)
      .where(and(eq(leadImportRow.importId, started.id), eq(leadImportRow.rowNumber, FAILING_ROW)));
    expect(failing).toBeDefined();
    // A stored cell no reader expects: the write throws on this row and on no other.
    await world.pools.admin.db
      .update(leadImportRow)
      .set({ cells: sql`jsonb_set(${leadImportRow.cells}, '{name}', '42')` })
      .where(and(eq(leadImportRow.importId, started.id), eq(leadImportRow.rowNumber, FAILING_ROW)));

    const run = await owner().call('POST', `/lead-imports/${started.id}/run`, {});
    expect(run.status).toBe(HttpStatus.OK);
    // One step takes every row of so short a file, and the failing one does not fail the step.
    const runs = world.http.app.get(CrmLeadImportRunService);
    await expect(runs.applyRows(started.step, Date.now())).resolves.toEqual({
      status: 'completed',
    });
    const report = await owner().call<LeadImport>('GET', `/lead-imports/${started.id}`);
    expect(report.body.results).toEqual({
      landed: FILE_ROWS - 1,
      logged: 0,
      skipped: 0,
      rejected: 1,
    });
    // Read on the admin path: the planted cell is no shape the report's contract carries.
    const rejected = await world.pools.admin.db
      .select({ rowNumber: leadImportRow.rowNumber, problems: leadImportRow.problems })
      .from(leadImportRow)
      .where(
        and(
          eq(leadImportRow.importId, started.id),
          sql`jsonb_array_length(${leadImportRow.problems}) > 0`,
        ),
      );
    expect(rejected).toEqual([{ rowNumber: FAILING_ROW, problems: ['not_written'] }]);
    expect(await leadsWith(world, tenantId, phones)).toHaveLength(FILE_ROWS - 1);
  });
});
