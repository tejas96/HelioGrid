import { LANGUAGES, type ProposalTemplateRead } from '@heliogrid/contracts';
import {
  createTranslator,
  customerProposalWords,
  customerSheetWords,
  SHELL,
  tierLabel,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { captureLead, ownerWithCompany } from '../support/project';
import { CUSTOMER, sharedLinkOf } from '../support/proposal';

const en = await createTranslator('en');
const hi = await createTranslator('hi');
const mr = await createTranslator('mr');

/** A well-formed address no link has: 43 base64url characters, as the token is minted. */
const UNKNOWN_TOKEN = 'A'.repeat(43);

/*
 * `SCR-F5-04`, `T-F5-004`, `T-F5-007`: an address no link has is the not-found page — it names no
 * company and no person, and it records no open: the open is sent by a drawn page of a real link
 * alone.
 */
test('an address no link has names nobody and records no open', async ({ page }) => {
  const beacons: string[] = [];
  page.on('request', (request) => {
    if (/\/customer-link\/[^/]+\/(opened|viewed)$/.test(request.url())) beacons.push(request.url());
  });
  await page.goto(`/p/${UNKNOWN_TOKEN}`);

  await expect(page.getByText(en.t(SHELL.notFound))).toBeVisible();
  expect(beacons).toEqual([]);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the customer’s page asks no search engine in and tells no other site where it came from', async ({
  page,
}) => {
  await page.goto(`/p/${UNKNOWN_TOKEN}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
});

/*
 * The live page (`T-F5-001`, `T-M01-030`): a company that switched its Timeline page off shares a
 * proposal; the customer opens the link in a browser of their own — no session — and the page shows
 * the proposal without the page the company left out; Accept asks once, and the page then says
 * what happens next. The draft is made through the api as `support/proposal.ts` starts one.
 */
test('a shared proposal opens with no session, leaves an off page out, and takes an Accept', async ({
  page,
  browser,
}) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const template = await page.request.get(`${API}/settings/proposal-template?reader=en`);
  const saved = (await template.json()) as ProposalTemplateRead;
  const off = await page.request.put(`${API}/settings/proposal-template`, {
    data: {
      cover: saved.cover,
      defaultTerms: saved.defaultTerms,
      sectionsIncluded: saved.sectionsIncluded.filter((section) => section !== 'timeline'),
    },
  });
  expect(off.status()).toBe(200);
  const link = await sharedLinkOf(page, leadId);

  const customer = await browser.newContext();
  const theirs = await customer.newPage();
  await theirs.goto(new URL(link).pathname);
  const words = customerProposalWords(en.t, NOBODY);
  await expect(theirs.getByRole('button', { name: words.acts.accept }).first()).toBeVisible();
  await expect(theirs.getByRole('heading', { name: words.cards.terms })).toBeVisible();
  // A real link's page states robots once too, and asks no engine to follow it (`F5-75`).
  await expect(theirs.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  );
  await expect(theirs.getByRole('heading', { name: words.cards.timeline })).toHaveCount(0);

  await theirs
    .getByRole('button', { name: words.acts.accept })
    .filter({ visible: true })
    .first()
    .click();
  await theirs
    .getByRole('dialog')
    .getByRole('button', { name: customerSheetWords(en.t, null).accept.confirm })
    .click();
  await expect(theirs.getByText(words.answer.steps(null)[2] ?? '')).toBeVisible();
  await customer.close();
});

const NOBODY = {
  companyName: '',
  customerName: null,
  customerSegment: null,
  personName: null,
  personPhone: null,
};

/** The facts the answered note reads: the lead `captureLead` makes, the owner who shares it. */
const SHARED = {
  ...NOBODY,
  customerName: CUSTOMER.name,
  customerSegment: 'residential',
  personName: OWNER_NAME,
} as const;

/** The hero's title in a reader's language, for the 3 kW system `sharedLinkOf` shares. */
const titleIn = (t: typeof en) => customerProposalWords(t.t, NOBODY).title('3');

/** Picks a language on the page's language pill, named in the language now on the page. */
async function pick(page: Page, from: keyof typeof LANGUAGES, to: keyof typeof LANGUAGES) {
  await page.getByRole('button', { name: LANGUAGES[from].endonym }).click();
  await page.getByRole('menuitemradio', { name: LANGUAGES[to].endonym }).click();
}

/*
 * `F5-08`: the page reads in the reader's language, and a language the reader picks is theirs for
 * the visit — English from Hindi draws English words, never loading bars for ever, and back.
 */
test('a Hindi reader picks English and then Marathi, and the page reads in each', async ({
  page,
  browser,
}) => {
  await ownerWithCompany(page, en);
  const link = await sharedLinkOf(page, await captureLead(page), 'hi');
  const customer = await browser.newContext();
  const theirs = await customer.newPage();
  await theirs.goto(new URL(link).pathname);
  await expect(theirs.getByRole('heading', { level: 1, name: titleIn(hi) })).toBeVisible();

  await pick(theirs, 'hi', 'en');
  await expect(theirs.getByRole('heading', { level: 1, name: titleIn(en) })).toBeVisible();
  await expect(theirs.locator('[aria-busy="true"]')).toHaveCount(0);

  await pick(theirs, 'en', 'mr');
  await expect(theirs.getByRole('heading', { level: 1, name: titleIn(mr) })).toBeVisible();
  await pick(theirs, 'mr', 'hi');
  await expect(theirs.getByRole('heading', { level: 1, name: titleIn(hi) })).toBeVisible();
  await customer.close();
});

/*
 * `T-F5-001`, `F5-36`, `CLAUDE.md` §9: every money and energy figure carries its tier — the hero's
 * price (typed: assumed) and monthly saving (estimated), and on the desktop's side card the price,
 * the subsidy line and the year's kWh with its source; payback is a duration and carries none.
 */
test('each money and energy figure on the page carries its tier', async ({ page, browser }) => {
  await ownerWithCompany(page, en);
  const link = await sharedLinkOf(page, await captureLead(page));
  const customer = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const theirs = await customer.newPage();
  await theirs.goto(new URL(link).pathname);
  const assumed = tierLabel(en.t, 'assumed');
  const estimated = tierLabel(en.t, 'estimated');

  const glass = theirs.locator('.hg-cust-hero-glass');
  await expect(glass.locator('div').nth(0)).toContainText(assumed);
  await expect(glass.locator('div').nth(1)).toContainText(estimated);
  await expect(glass.locator('div').nth(2)).not.toContainText(estimated);

  const side = theirs.locator('.hg-cust-sidecard');
  await expect(side.locator('.hg-cust-over-row')).toContainText(assumed);
  await expect(side.locator('.hg-cust-facts')).toContainText(estimated);
  await customer.close();
});

/* `F7-23` N5: Accept leaves with its sheet and its button; focus lands on the note that says it. */
test('after Accept, focus lands on the note that says what was accepted', async ({
  page,
  browser,
}) => {
  await ownerWithCompany(page, en);
  const link = await sharedLinkOf(page, await captureLead(page));
  const customer = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const theirs = await customer.newPage();
  await theirs.goto(new URL(link).pathname);
  const words = customerProposalWords(en.t, SHARED);

  await theirs
    .getByRole('button', { name: words.acts.accept })
    .filter({ visible: true })
    .first()
    .click();
  await theirs
    .getByRole('dialog')
    .getByRole('button', { name: customerSheetWords(en.t, null).accept.confirm })
    .click();
  await expect(theirs.locator(':focus')).toContainText(words.answer.acceptedTitle);
  await customer.close();
});

/*
 * `F7-23` N5: a decline and a change request leave with their sheet too, while the act that
 * opened it stays (relabelled); the sheet's own restore must not keep focus there — it lands on
 * the note that says what the customer did, at the phone's width and the desktop's.
 */
for (const [answer, width] of [
  ['decline', 390],
  ['decline', 1440],
  ['change', 390],
  ['change', 1440],
] as const) {
  test(`after a ${answer} at ${width}, focus lands on the note that says it`, async ({
    page,
    browser,
  }) => {
    await ownerWithCompany(page, en);
    const link = await sharedLinkOf(page, await captureLead(page));
    const customer = await browser.newContext({ viewport: { width, height: 900 } });
    const theirs = await customer.newPage();
    await theirs.goto(new URL(link).pathname);
    const words = customerProposalWords(en.t, SHARED);
    const sheets = customerSheetWords(en.t, null);
    const ask = theirs
      .getByRole('button', { name: words.acts.askWide })
      .or(theirs.getByRole('button', { name: words.acts.askOrChange }));

    await ask.filter({ visible: true }).first().click();
    const more = theirs.getByRole('dialog').filter({ hasText: sheets.more.title });
    await more.getByRole('button', { name: sheets.more[answer] }).click();
    const sheet = theirs.getByRole('dialog').filter({ hasText: sheets[answer].title });
    if (answer === 'decline') {
      await sheet.getByRole('button', { name: sheets.decline.reasons[0] ?? '' }).click();
      await sheet.getByRole('button', { name: sheets.decline.confirm }).click();
    } else {
      await sheet.getByRole('button', { name: sheets.change.suggestions[0] ?? '' }).click();
      await sheet.getByRole('button', { name: sheets.change.send }).click();
    }
    const said = answer === 'decline' ? words.answer.declinedTitle : words.answer.changeTitle;
    await expect(theirs.locator(':focus')).toContainText(said);
    await customer.close();
  });
}
