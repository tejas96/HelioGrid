import { randomUUID } from 'node:crypto';
import type { ProjectPayments, ReceiptPdf, ReferenceCheck } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ProjectsPaymentReceiptService } from '../../src/modules/projects/projects.payment-receipt.service';
import { skipWithoutDatabase } from '../support/fixture';
import { aProjectAt, freshUtr, paymentsOf, recordPayment, spaced } from './payments-support';
import {
  acted,
  aStaffedCompany,
  dayFromToday,
  now,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
  walk,
} from './support';

/**
 * A payment's receipt (`M11-41`, `M11-42`): the PDF made the way its workflow's two api steps make
 * it — through the service, no Temporal — then kept against the payment and handed out by link;
 * and the UTR check the record sheet asks while the reference is typed (`M11-38`).
 */

const here = aStaffedCompany('Payment Receipt EPC', {
  owner: [FOUNDER_ROLE],
  finance: [preset.finance],
  installer: [preset.installation_team_member],
});

const skip = skipWithoutDatabase(
  'PAYMENT RECEIPT PROOF',
  'A payment’s receipt PDF and the UTR check are UNPROVEN on the wire in this run.',
);

/** Rupees paid on the part later waived, and on the next part. */
const FIRST_PAID = 1000;
const SECOND_PAID = 2000;

describe.skipIf(skip)('a payment’s receipt PDF and the UTR check', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const finance = () => world.as(here.members.finance);
  const installer = () => world.as(here.members.installer);
  const receipts = () => world.http.app.get(ProjectsPaymentReceiptService);
  const tenantId = () => here.company.tenantId;

  const aPayment = async (reference: string | null = null) => {
    const projectId = await aProjectAt(owner(), here.people.owner.userId);
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reply = await recordPayment(finance(), projectId, {
      partId: first?.id,
      amount: '1000.00',
      reference,
    });
    expect(reply.status).toBe(HttpStatus.CREATED);
    return { projectId, entryId: reply.body.recordedId, payments: reply.body };
  };
  const aPdf = async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    return Buffer.from(await pdf.save()).toString('base64');
  };

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('prints the payment as the ledger stood, with its number, figures and who recorded it', async () => {
    const { entryId, payments } = await aPayment('4321 8765 3390');
    const page = await receipts().page({ tenantId: tenantId(), entryId });
    if (page?.kind !== 'page') throw new Error(`expected a page, got ${JSON.stringify(page)}`);
    const receipt = payments.entries.find((one) => one.id === entryId)?.receiptNumber ?? '';
    expect(page.html).toContain(receipt);
    expect(page.html).toContain('₹1,000.00');
    expect(page.html).toContain('4321 8765 3390');
    expect(page.html).toContain('Part 1 of');
    expect(page.html).toContain('not a tax invoice');
  });

  it('prints what is left as the app reads it: a part paid in part then waived owes nothing more', async () => {
    const projectId = await aProjectAt(owner(), here.people.owner.userId);
    const [first, second] = (await paymentsOf(owner(), projectId)).parts;
    if (first === undefined || second === undefined) throw new Error('two parts expected');
    await recordPayment(finance(), projectId, { partId: first.id, amount: `${FIRST_PAID}.00` });
    await owner().call('POST', `/projects/${projectId}/parts/${first.id}/waive`, {
      reason: 'Goodwill',
      capturedAt: now(),
    });
    const reply = await recordPayment(finance(), projectId, {
      partId: second.id,
      amount: `${SECOND_PAID}.00`,
    });
    const left = reply.body.parts.reduce((sum, part) => sum + Number(part.outstanding), 0);
    const page = await receipts().page({ tenantId: tenantId(), entryId: reply.body.recordedId });
    if (page?.kind !== 'page') throw new Error('expected a page');
    const shown = (amount: number) =>
      `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    expect(page.html).toContain(`>${shown(left)}<`);
    expect(page.html).toContain(`>${shown(FIRST_PAID + SECOND_PAID)}<`);
  });

  it('keeps the PDF once: a second ask finds it kept and makes nothing', async () => {
    const { entryId } = await aPayment();
    const kept = await receipts().keep(
      { tenantId: tenantId(), entryId, pdfBase64: await aPdf() },
      Date.now(),
    );
    expect(kept.fileId).not.toBeNull();
    expect(await receipts().page({ tenantId: tenantId(), entryId })).toEqual({
      kind: 'kept',
      fileId: kept.fileId,
    });
  });

  it('a reversal, the payment it took back, or an unknown id has no receipt: the run ends', async () => {
    const { projectId, entryId } = await aPayment();
    const reversed = await owner().call<ProjectPayments>(
      'POST',
      `/projects/${projectId}/payments/${entryId}/reverse`,
      { reason: 'Recorded twice', capturedAt: now() },
    );
    const reversal = reversed.body.entries.find((one) => one.reversesId === entryId)?.id ?? '';
    expect(await receipts().page({ tenantId: tenantId(), entryId: reversal })).toBeNull();
    // The payment taken back has no receipt either, by the page or by the route.
    expect(await receipts().page({ tenantId: tenantId(), entryId })).toBeNull();
    for (const route of ['receipt-pdf', 'receipt']) {
      const asked = await owner().call(
        'GET',
        `/projects/${projectId}/payments/${entryId}/${route}`,
      );
      expect(asked.status).toBe(HttpStatus.NOT_FOUND);
    }
    expect(await receipts().page({ tenantId: tenantId(), entryId: randomUUID() })).toBeNull();
  });

  it('hands the kept PDF out by link to who sees the money, never to the crew (M11-56)', async () => {
    const { projectId, entryId } = await aPayment();
    await receipts().keep({ tenantId: tenantId(), entryId, pdfBase64: await aPdf() }, Date.now());
    const path = `/projects/${projectId}/payments/${entryId}/receipt-pdf`;
    const own = await finance().call<ReceiptPdf>('GET', path);
    expect(own.status).toBe(HttpStatus.OK);
    expect(own.body.download?.url).toEqual(expect.any(String));
    await walk(owner(), projectId, ['material_ordered']);
    await acted(owner(), projectId, 'dispatch', {
      crew: [here.people.installer.userId],
      leftOn: dayFromToday(0),
    });
    expect((await installer().call('GET', path)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('says while it is typed whether a UTR is already on a receipt that stands (M11-38)', async () => {
    const utr = freshUtr('7');
    const { payments, entryId } = await aPayment(utr);
    const receipt = payments.entries.find((one) => one.id === entryId)?.receiptNumber;
    const check = (reference: string) =>
      finance().call<ReferenceCheck>(
        'GET',
        `/payments/references?reference=${encodeURIComponent(reference)}`,
      );
    expect((await check(spaced(utr))).body).toEqual({ receiptNumber: receipt });
    expect((await check(freshUtr('8'))).body).toEqual({ receiptNumber: null });
    expect((await installer().call('GET', `/payments/references?reference=${utr}`)).status).toBe(
      HttpStatus.FORBIDDEN,
    );
  });
});
