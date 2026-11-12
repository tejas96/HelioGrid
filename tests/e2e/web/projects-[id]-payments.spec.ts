import {
  createTranslator,
  moneyDueWords,
  paymentFailureWords,
  paymentsPageWords,
  projectMoneyWords,
} from '@heliogrid/i18n';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import {
  dueNow,
  freshUtr,
  packMoney,
  readPayments,
  saveUpiThroughApi,
  UPI_ID,
  webSheetWords,
} from '../support/payments';
import { CUSTOMER, ownerWithProject, toastSaying } from '../support/project';
import { packWord } from '../support/project-facts';

/**
 * `/projects/<id>/payments` (`SCR-M11-02`, `SCR-M11-03`): the owner at a desk, come to see what is
 * due and record the money that came in. A project won from the company's default terms has its
 * parts, the first due at Won: the hero asks for exactly what that part owes, Collect opens on the
 * bank — the company has no UPI ID — and its UPI way says where to add one; once the UPI ID is
 * saved, the same sheet shows the part's QR. Record starts at what the part owes; a send the
 * network drops is refused inside the sheet and nothing is recorded, and the send again records it,
 * its receipt in the toast and the entry in the received list.
 */
const en = await createTranslator('en');
const PAGE = paymentsPageWords(en.t);
const DUE = moneyDueWords(en.t);
const MONEY = projectMoneyWords(en.t);
const SHEET = webSheetWords(en);

/** A new company's project at Won, its payments page open on the hero; answers its money. */
async function openPayments(page: Page) {
  const { projectId } = await ownerWithProject(page, en);
  const payments = await readPayments(page, projectId);
  await page.goto(`/projects/${projectId}/payments`);
  await expect(page.getByRole('heading', { level: 1, name: PAGE.title })).toBeVisible();
  return { projectId, payments, ...dueNow(payments) };
}

const act = (within: Page | Locator, name: string) =>
  within.getByRole('button', { name, exact: true });

test('the hero asks for the part due now, the parts and the summary follow the terms', async ({
  page,
}) => {
  const { payments, request, part } = await openPayments(page);
  const hero = page.getByRole('region', { name: MONEY.toCollectNow, exact: true });
  await expect(hero.getByText(packMoney(request.amount), { exact: true })).toBeVisible();
  await expect(
    hero.getByText(MONEY.partOf(part.label, part.position, payments.parts.length), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(PAGE.summary(CUSTOMER.name, payments.number, payments.parts.length), {
      exact: true,
    }),
  ).toBeVisible();
  const parts = page.getByRole('region', { name: MONEY.parts, exact: true });
  for (const one of payments.parts) {
    await expect(parts.getByText(one.label, { exact: false }).first()).toBeVisible();
  }
  await expect(act(page, MONEY.collect)).toBeVisible();
  await expect(act(page, MONEY.record)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
});

test('Collect opens on UPI saying how to add the UPI ID, and shows the part’s QR once one is saved', async ({
  page,
}) => {
  const { request } = await openPayments(page);
  const amount = packMoney(request.amount);

  await act(page, MONEY.collect).click();
  const sheet = page.getByRole('dialog', { name: SHEET.collectTitle(amount) });
  await expect(sheet.getByText(SHEET.noUpi, { exact: true })).toBeVisible();
  await sheet.getByText(SHEET.bankTab, { exact: true }).click();
  await expect(sheet.getByText(SHEET.noBank, { exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);
  await act(sheet, SHEET.close).click();
  await expect(sheet).toHaveCount(0);

  /* The pay request reads the company's UPI ID: saved, the same part's sheet opens on its QR. */
  await saveUpiThroughApi(page, { upiId: UPI_ID, payee: OWNER_NAME });
  await page.reload();
  await act(page, MONEY.collect).click();
  await expect(sheet.getByRole('img', { name: SHEET.qrLabel(amount) })).toBeVisible();
  await expect(sheet.getByText(UPI_ID, { exact: true })).toBeVisible();
  /* The India pack opens the request in the customer's WhatsApp; the copy sits beside it. */
  await expect(act(sheet, SHEET.sendChat)).toBeVisible();
  await expect(sheet.getByRole('button', { name: SHEET.send, exact: true })).toBeVisible();
});

test('a record the network drops is refused in the sheet; sent again it is recorded with its receipt', async ({
  page,
}) => {
  const { projectId, part } = await openPayments(page);
  const owed = packMoney(part.outstanding);
  const utr = freshUtr();

  await act(page, MONEY.record).click();
  const sheet = page.getByRole('dialog', { name: SHEET.recordTitle });
  await expect(sheet.getByText(SHEET.recordLead(part.label, owed), { exact: true })).toBeVisible();
  await sheet.getByRole('textbox', { name: SHEET.reference, exact: true }).fill(utr);
  /* While typed, the sheet says the amount clears the part and the UTR is on no receipt yet. */
  await expect(sheet.getByText(SHEET.amountMatches, { exact: true })).toBeVisible();
  await expect(sheet.getByText(SHEET.referenceNew, { exact: true })).toBeVisible();
  /* The amount starts as what the part still owes, so the send names it. */
  const save = act(sheet, SHEET.save(owed));
  await expect(save).toBeVisible();

  /* `F8-36`: the save never reaches the api — the sheet stays, says so, and nothing is recorded. */
  const recordPath = `**/projects/${projectId}/payments`;
  await page.route(recordPath, (route) =>
    route.request().method() === 'POST' ? route.abort() : route.fallback(),
  );
  await save.click();
  await expect(sheet.getByRole('alert')).toHaveText(paymentFailureWords(en.t, { kind: 'failed' }));
  expect((await readPayments(page, projectId)).entries).toEqual([]);

  await page.unroute(recordPath);
  await save.click();
  await expect(sheet).toHaveCount(0);
  const [entry] = (await readPayments(page, projectId)).entries;
  if (entry === undefined) throw new Error('the record sent again left no entry');
  expect(entry).toMatchObject({ kind: 'payment', reference: utr, amount: part.outstanding });
  await expect(
    toastSaying(page, PAGE.toast({ kind: 'recorded', receiptNumber: entry.receiptNumber })),
  ).toBeVisible();

  /* The money is in: the received list holds it with its mode and UTR, and nothing is due now. */
  const received = page.getByRole('region', { name: MONEY.received, exact: true });
  await expect(
    received.getByText(MONEY.entryReference(packWord('mode', 'upi'), utr), { exact: true }),
  ).toBeVisible();
  const hero = page.getByRole('region', { name: MONEY.toCollectNow, exact: true });
  await expect(hero.getByText(MONEY.nothingDue, { exact: true })).toBeVisible();
});

test('Money due on the owner’s home groups the part due today, and Remind opens its collect sheet', async ({
  page,
}) => {
  const { request } = await openPayments(page);
  await page.goto('/');
  const due = page.getByRole('region', { name: DUE.moneyDue, exact: true });
  // The group's head and the row's mark both say it.
  await expect(due.getByText(DUE.group('due'), { exact: true }).first()).toBeVisible();
  await expect(due.getByText(CUSTOMER.name, { exact: true })).toBeVisible();
  await due.getByRole('button', { name: DUE.remindRow(CUSTOMER.name) }).click();
  await expect(
    page.getByRole('dialog', { name: SHEET.collectTitle(packMoney(request.amount)) }),
  ).toBeVisible();
  await expectNoSeriousViolations(page);
});
