import { IDEMPOTENCY_KEY_HEADER, type LeadDetail, type MergePreview } from '@heliogrid/contracts';
import {
  CUSTOMER_MERGE,
  createTranslator,
  customerMergeUnavailableWords,
  customerMergeWords,
  MERGE_FIELD_WORD,
  MERGE_MOVE_WORD,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/customers/merge` (`SCR-M02-06`, T-M02-006): the owner meets one family entered twice — Sunita
 * and Vinayak enquired separately. The merge sleeps until every differing field is picked; before it
 * runs the page says what moves, what the other record becomes, that no money changes and that it
 * cannot be undone; it runs only on the press, and lands calm on *Open customer*. A new company is
 * empty, so both leads are captured through the api inside the flow, under the owner's own session.
 */
const en = await createTranslator('en');
const WORDS = customerMergeWords(en.t);

const SUNITA = { name: 'Sunita Kulkarni', city: 'Satara' };
const VINAYAK = { name: 'Vinayak Kulkarni', city: 'Godoli, Satara' };

/** A lead captured by quick add through the api; answers its customer and its lead. */
async function capture(page: Page, who: { name: string; city: string }) {
  const answer = await page.request.post(`${API}/leads`, {
    data: {
      phoneE164: freshMobile().e164,
      ...who,
      segment: 'residential',
      capturedAt: new Date().toISOString(),
    },
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(answer.status()).toBe(201);
  const lead = (await answer.json()) as LeadDetail;
  return { customerId: lead.customer.id, leadId: lead.lead.id };
}

async function ownerWithTwoRecords(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  return { sunita: await capture(page, SUNITA), vinayak: await capture(page, VINAYAK) };
}

const mergePage = (survivorId: string, loserId: string) =>
  `/customers/merge?survivorId=${survivorId}&loserId=${loserId}`;

test('the confirm step names what moves, what the loser becomes and that it cannot be undone', async ({
  page,
}) => {
  /* A fault the page throws — an effect's cleanup that is not a function among them — fails the
     flow even where the page still draws. */
  const faults: string[] = [];
  page.on('pageerror', (fault) => faults.push(fault.message));
  const { sunita, vinayak } = await ownerWithTwoRecords(page);
  await page.goto(mergePage(sunita.customerId, vinayak.customerId));
  await expect(page.getByRole('heading', { name: WORDS.title })).toBeVisible();

  /* The confirm, read before the press: what moves, the tombstone, no money, cannot be undone. */
  const confirm = page.getByRole('region', { name: en.t(CUSTOMER_MERGE.movesHeading) });
  await expect(
    confirm.getByText(en.t(CUSTOMER_MERGE.movesInto, { name: SUNITA.name })),
  ).toBeVisible();
  for (const kind of Object.values(MERGE_MOVE_WORD)) {
    await expect(confirm.getByText(en.t(kind), { exact: true })).toBeVisible();
  }
  await expect(
    confirm.getByText(
      en.t(CUSTOMER_MERGE.tombstone, { loser: VINAYAK.name, survivor: SUNITA.name }),
    ),
  ).toBeVisible();
  await expect(confirm.getByText(en.t(CUSTOMER_MERGE.noMoney))).toBeVisible();
  await expect(confirm.getByText(WORDS.cannotUndo)).toBeVisible();

  /* The act sleeps until every differing field is picked — never guessed. */
  const act = page.getByRole('button', { name: WORDS.merge });
  await expect(act).toBeDisabled();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
  for (const field of ['name', 'city', 'primary_contact'] as const) {
    const choice = page.getByRole('radiogroup', {
      name: en.t(MERGE_FIELD_WORD[field]),
      exact: true,
    });
    await choice.getByRole('radio').first().click();
  }
  await expect(page.getByText(en.t(CUSTOMER_MERGE.allPicked))).toBeVisible();
  await expect(act).toBeEnabled();

  /* It runs only on the press, and lands calm, focus on Open customer. */
  await act.click();
  await expect(page.getByRole('heading', { name: WORDS.done.title })).toBeVisible();
  const open = page.getByRole('button', { name: WORDS.done.openCustomer });
  await expect(open).toBeFocused();
  expect(faults).toEqual([]);
  /* The survivor's current lead — both now stand on it — under the name kept; leaving the done
     page runs its effects' cleanups. */
  await open.click();
  await expect(page).toHaveURL(new RegExp(`/leads/(${sunita.leadId}|${vinayak.leadId})$`));
  await expect(page.getByRole('heading', { name: SUNITA.name })).toBeVisible();
  expect(faults).toEqual([]);
});

test('merge is unavailable with its reason when one record is out of scope', async ({ page }) => {
  const { sunita, vinayak } = await ownerWithTwoRecords(page);
  /* An owner sees every lead, so the refusal a sales manager meets is the api's answer, as sent. */
  const outside: MergePreview = {
    blocked: 'out_of_scope',
    heldBy: 'Rajesh Jadhav',
    survivor: null,
    loser: null,
    differences: [],
    moves: null,
  };
  await page.route(`${API}/customers/merge-preview**`, (route) => route.fulfill({ json: outside }));
  await page.goto(mergePage(sunita.customerId, vinayak.customerId));

  const words = customerMergeUnavailableWords(en.t, {
    kind: 'out_of_scope',
    heldBy: 'Rajesh Jadhav',
  });
  await expect(page.getByText(words.title)).toBeVisible();
  await expect(page.getByText(words.line)).toBeVisible();
  /* The locked record's own line, not the scope note that names the same holder in a sentence. */
  await expect(page.getByText(words.locked?.holder ?? '', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: WORDS.merge })).toHaveCount(0);
  await expect(page.getByText(VINAYAK.name)).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
