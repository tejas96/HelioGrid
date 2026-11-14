import { randomUUID } from 'node:crypto';
import type { MoneyDue } from '@heliogrid/contracts';
import { projectStageTransition } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PDFDocument } from 'pdf-lib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ProjectsPaymentReceiptService } from '../../src/modules/projects/projects.payment-receipt.service';
import {
  aLead,
  aShared,
  aStaffedCompany,
  customersLink,
  linkAct,
  openProposalsWorld,
  type ProposalsWorld,
  pageOf,
  preset,
} from '../customer-link/support';
import { skipWithoutDatabase } from '../support/fixture';
import { aWonAcceptedDeal, type HandoffTeam } from './handoff-support';
import { paymentsOf, recordPayment } from './payments-support';
import {
  acted,
  aStoredFile,
  aWin,
  dayFromToday,
  detailOf,
  markWon,
  now,
  TO_COMMISSIONED,
  walk,
} from './support';

/**
 * The customer's link over its PUBLIC routes, on real project rows (`T-F5-002`, `T-F5-003`;
 * `F5-21`, `F5-24`, `F5-59`, `F5-71`, `M08-39`): a receipt's PDF and a handed-over document are
 * served by the token only once the page lists them, and a part long overdue withholds nothing.
 */

const here = aStaffedCompany('Customer Files EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  seller: [preset.sales_executive],
  finance: [preset.finance],
});

const skip = skipWithoutDatabase(
  'CUSTOMER FILES PROOF',
  'The receipt, the solar file and an overdue part on the public link are UNPROVEN in this run.',
);

/** Far enough back that the advance due at Won is late on Money due. */
const WON_DAYS_AGO = -40;
const DAY_MS = 86_400_000;

describe.skipIf(skip)('the customer’s link over its public routes, on real project rows', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const tenantId = () => here.company.tenantId;
  const anonymous = <T>(path: string) => world.http.callAnonymously<T>('GET', path);
  const fileOf = (token: string, fileId: string) =>
    anonymous<{ url: string }>(`/customer-link/${token}/files/${fileId}`);
  const team = (): HandoffTeam => ({
    owner: owner(),
    seller: world.as(here.members.seller),
    sellerId: here.people.seller.userId,
    managerId: here.people.pm.userId,
  });
  const aPdf = async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    return Buffer.from(await pdf.save()).toString('base64');
  };

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a receipt’s kept PDF is served by the token once the page lists it, and no other file is (F5-59, M11-45)', async () => {
    const deal = await aWonAcceptedDeal(world, team());
    const [first] = (await paymentsOf(owner(), deal.projectId)).parts;
    const paid = await recordPayment(world.as(here.members.finance), deal.projectId, {
      partId: first?.id,
      amount: '1000.00',
    });
    expect(paid.status).toBe(HttpStatus.CREATED);
    const kept = await world.http.app
      .get(ProjectsPaymentReceiptService)
      .keep(
        { tenantId: tenantId(), entryId: paid.body.recordedId, pdfBase64: await aPdf() },
        Date.now(),
      );
    const fileId = kept.fileId ?? '';

    const page = await pageOf(world, deal.token);
    const [receipt] = page.body.progress?.payments.parts[0]?.receipts ?? [];
    expect(receipt?.fileId).toBe(fileId);
    const served = await fileOf(deal.token, fileId);
    expect(served.status).toBe(HttpStatus.OK);
    expect(served.body.url).toEqual(expect.any(String));

    const unlisted = await aStoredFile(world, tenantId(), { kind: 'project', ref: deal.projectId });
    expect((await fileOf(deal.token, unlisted)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a reversed payment’s receipt stays on the page, reads reversed with its day, and its PDF is no longer served (F5-59, M11-46)', async () => {
    const deal = await aWonAcceptedDeal(world, team());
    const [first] = (await paymentsOf(owner(), deal.projectId)).parts;
    const paid = await recordPayment(owner(), deal.projectId, {
      partId: first?.id,
      amount: '1000.00',
    });
    const entryId = paid.body.recordedId;
    const kept = await world.http.app
      .get(ProjectsPaymentReceiptService)
      .keep({ tenantId: tenantId(), entryId, pdfBase64: await aPdf() }, Date.now());
    const reversed = await owner().call(
      'POST',
      `/projects/${deal.projectId}/payments/${entryId}/reverse`,
      { reason: 'Recorded twice', capturedAt: now() },
    );
    expect(reversed.status).toBe(HttpStatus.OK);

    const page = await pageOf(world, deal.token);
    const receipts = page.body.progress?.payments.parts[0]?.receipts ?? [];
    expect(receipts).toHaveLength(1);
    expect(receipts[0]).toMatchObject({ reversedOn: dayFromToday(0), fileId: null });
    expect((await fileOf(deal.token, kept.fileId ?? '')).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a done row’s paper is in the solar file and served only once the project is handed over (F5-71, M08-46)', async () => {
    const leadId = await aLead(owner());
    await aShared(owner(), leadId);
    const { token } = await customersLink(owner(), leadId);
    const won = await markWon(owner(), leadId, aWin(here.people.owner.userId));
    expect(won.status).toBe(HttpStatus.CREATED);
    const { projectId } = won.body;
    await walk(owner(), projectId, [...TO_COMMISSIONED, 'incentive_claimed']);
    const paper = await aStoredFile(world, tenantId(), { kind: 'project', ref: projectId });
    await acted(owner(), projectId, 'files', {
      fileId: paper,
      slot: 'document',
      slotKey: 'warranty_documents',
      name: 'Warranty.pdf',
    });
    expect((await fileOf(token, paper)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await pageOf(world, token)).body.handover).toBeUndefined();

    const pending = (await detailOf(owner(), projectId)).body.documents.filter(
      (one) => one.state === 'pending' && one.row !== 'handover_pack',
    );
    for (const row of pending) {
      await acted(owner(), projectId, 'documents/not-needed', { row: row.row, reason: 'Outside' });
    }
    await acted(owner(), projectId, 'handover');

    const page = await pageOf(world, token);
    expect(page.body.handover?.documents).toContainEqual(
      expect.objectContaining({ fileId: paper, name: 'Warranty.pdf' }),
    );
    expect((await fileOf(token, paper)).status).toBe(HttpStatus.OK);
    expect((await fileOf(token, randomUUID())).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a part weeks overdue withholds nothing: the progress, the way to pay and the asks all stand (F5-24, M08-39)', async () => {
    const deal = await aWonAcceptedDeal(world, team());
    await world.pools.admin.db
      .update(projectStageTransition)
      .set({
        enteredOn: dayFromToday(WON_DAYS_AGO),
        movedAt: new Date(Date.now() + WON_DAYS_AGO * DAY_MS),
      })
      .where(
        and(
          eq(projectStageTransition.projectId, deal.projectId),
          eq(projectStageTransition.toStage, 'won'),
        ),
      );
    const due = await world
      .as(here.members.finance)
      .call<MoneyDue>('GET', '/payments/due?page=1&limit=100&group=late');
    expect(due.body.rows.items.map((row) => row.projectId)).toContain(deal.projectId);

    const page = await pageOf(world, deal.token);
    expect(page.status).toBe(HttpStatus.OK);
    const [advance] = (await paymentsOf(owner(), deal.projectId)).parts;
    expect(page.body.progress?.payments.due).toMatchObject({ amount: advance?.amount });
    expect(page.body.progress?.stages.length).toBeGreaterThan(0);
    const asked = await linkAct(world, deal.token, 'questions', { text: 'When do you come?' });
    expect(asked.status).toBe(HttpStatus.OK);
  });
});
