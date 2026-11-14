import { PROPOSAL_LIMITS } from '@heliogrid/domain';
import {
  createTranslator,
  proposalBankStepWords,
  proposalClientStepWords,
  proposalComponentsStepWords,
  proposalPerformanceStepWords,
  proposalSystemStepWords,
  proposalTermsStepWords,
  proposalTimelineStepWords,
  proposalTrackRecordStepWords,
  tierLabel,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { DEFAULT_FAILED, MARK } from '../support/proposal-step-cases';
import { StepCaseStory } from './ProposalStepCases.story';

/**
 * Builder steps in the cases their view models reach (`T-M06-008`, `T-M06-011`, `T-M06-013`,
 * `T-M06-022`, `M06-15`): a blocking row marks its field once Generate jumps there; terms past
 * their pages are refused where they are typed; *Save as company default* says what it came to, and
 * is not offered without the right; the bank switch off says the account is kept but not printed;
 * and a row act that takes itself away hands focus to the step's title.
 */
const en = await createTranslator('en');
const HEADING = 'Step heading';
const terms = proposalTermsStepWords(en.t, {});
const timeline = proposalTimelineStepWords(en.t);

test.use({ viewport: { width: 375, height: 812 } });

test('a blocking row marks its own field after the jump', async ({ mount, page }) => {
  await mount(<StepCaseStory kase="price-marked" heading={HEADING} />);
  await expect(page.getByText(MARK.title)).toBeVisible();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(1);
});

test('step 3’s customer type is a field with its name drawn above it, as Quick add asks it', async ({
  mount,
  page,
}) => {
  await mount(<StepCaseStory kase="price-marked" heading={HEADING} />);
  const words = proposalSystemStepWords(en.t, {
    name: 'Anil',
    taxName: 'GST',
    taxRateText: '8.9%',
    taxRegistered: true,
    supplyPhase: null,
    maintenance: { kind: 'none', years: null },
  });
  await expect(page.getByText(words.category, { exact: true })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: words.category, exact: true })).toBeVisible();
});

test('a blocking row with no one field of its own is said once, at the step’s top', async ({
  mount,
  page,
}) => {
  await mount(<StepCaseStory kase="list-marked" heading={HEADING} />);
  await expect(page.getByText(MARK.title)).toHaveCount(1);
  await expect(page.getByText(MARK.line)).toBeVisible();
});

test('terms past their pages are refused where they are typed', async ({ mount, page }) => {
  await mount(<StepCaseStory kase="terms-over" heading={HEADING} />);
  await expect(page.getByText(terms.overPages)).toBeVisible();
});

test('Save as company default says it landed, and says where it failed', async ({
  mount,
  page,
}) => {
  const saved = await mount(<StepCaseStory kase="terms-saved" heading={HEADING} />);
  await expect(page.getByRole('button', { name: terms.saveAsDefault })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: terms.defaultSaved })).toBeVisible();
  await saved.unmount();

  await mount(<StepCaseStory kase="terms-failed" heading={HEADING} />);
  await expect(page.getByText(DEFAULT_FAILED)).toBeVisible();
  await expect(page.getByText(terms.defaultSaved)).toHaveCount(0);
});

test('without the settings right Save as company default is not offered', async ({
  mount,
  page,
}) => {
  await mount(<StepCaseStory kase="terms-other" heading={HEADING} />);
  await expect(page.getByRole('button', { name: terms.saveAsDefault })).toHaveCount(0);
  await expect(page.getByText(terms.staysHere)).toBeVisible();
});

test('the bank switch off says the account is kept but not printed', async ({ mount, page }) => {
  await mount(<StepCaseStory kase="bank-off" heading={HEADING} />);
  const words = proposalBankStepWords(en.t, { include: false, owner: '', routingLabel: 'IFSC' });
  await expect(page.getByRole('switch', { name: words.include })).not.toBeChecked();
  await expect(page.getByText(words.includeLine)).toBeVisible();
});

test('timeline rows move and go; a row act that takes itself away hands focus to the title', async ({
  mount,
  page,
}) => {
  await mount(<StepCaseStory kase="timeline" heading={HEADING} />);
  const rows = page.locator('.hg-pst-row');
  const count = await rows.count();
  const second = (await rows.nth(1).locator('.hg-pst-row-title').textContent()) ?? '';

  /* Up on the second row: it is first now, its own Up off — and the keyboard is never dropped. */
  await page.getByRole('button', { name: timeline.moveUp(second) }).focus();
  await page.keyboard.press('Enter');
  await expect(rows.first().locator('.hg-pst-row-title')).toHaveText(second);
  await expect(page.getByRole('button', { name: timeline.moveUp(second) })).toBeDisabled();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);

  /* The last row's remove takes its row away: focus lands on the title, never the page. */
  const last = (await rows.last().locator('.hg-pst-row-title').textContent()) ?? '';
  await page.getByRole('button', { name: timeline.remove(last) }).focus();
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(count - 1);
  await expect(page.getByRole('heading', { name: HEADING })).toBeFocused();
});

test('step 2’s figures carry their units, and a word typed into one is not taken', async ({
  mount,
  page,
}) => {
  await mount(<StepCaseStory kase="record" heading={HEADING} />);
  const words = proposalTrackRecordStepWords(en.t, { where: 'other' });
  const happy = page.getByRole('textbox', { name: words.counts.happyCustomers });
  await expect(page.getByText(words.counts.citiesServed, { exact: true }).first()).toBeVisible();
  const before = await happy.inputValue();

  await happy.fill('many');
  await happy.blur();

  await expect(happy).toHaveValue(before);
});

test('the proposal number is shown as the server gives it, never as a field', async ({
  mount,
  page,
}) => {
  await mount(<StepCaseStory kase="client" heading={HEADING} />);
  const words = proposalClientStepWords(en.t, {
    name: 'Anil',
    language: 'English',
    customersOwn: true,
  });
  await expect(page.getByText(words.numberLabel)).toBeVisible();
  await expect(page.getByText(words.numberValue)).toBeVisible();
  await expect(page.getByRole('textbox', { name: words.numberLabel })).toHaveCount(0);
});

/*
 * `T-M06-006`: step 4's figures fill themselves and say so — the yearly figure labelled
 * `estimated` over its twelve bars — and ↺ puts the filled months back after a month is typed over.
 */
test('step 4’s filled figures are labelled estimated, chart their months, and ↺ restores them', async ({
  mount,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<StepCaseStory kase="performance" heading={HEADING} />);
  const hero = page.locator('.hg-pst-hero');
  await expect(hero.getByText(tierLabel(en.t, 'estimated'))).toBeVisible();
  await expect(hero.locator('.hg-pb-bar')).toHaveCount(12);
  await expect(hero.locator('.hg-pb-bar[data-peak]')).toHaveCount(1);

  const words = proposalPerformanceStepWords(en.t, {
    fill: 'source',
    source: 'PVGIS',
    place: 'Pune',
    sizeText: '3',
    tolerance: 10,
    monthNames: ['Jan'],
    edited: false,
    wants: { size: false, state: false, refused: false },
  });
  await page.getByRole('button', { name: words.months }).click();
  const january = page.getByRole('textbox', { name: 'Jan', exact: true });
  const filled = await january.inputValue();
  await january.fill('1');
  await january.press('Enter');
  await expect(january).toHaveValue('1');
  await page.getByRole('button', { name: words.refill }).click();
  await expect(january).toHaveValue(filled);
});

/*
 * `T-M06-010`: an empty draft's step 8 counts none of the five kinds picked; each empty kind says
 * so and opens its picker.
 */
test('an empty draft’s step 8 counts 0 of 5 kinds', async ({ mount, page }) => {
  await mount(<StepCaseStory kase="components-empty" heading={HEADING} />);
  const words = proposalComponentsStepWords(en.t, {
    name: 'Anil',
    picked: 0,
    required: 5,
    maxBrands: PROPOSAL_LIMITS.brandsPerCategory,
  });
  await expect(page.locator('.hg-pst-ring')).toContainText('0/5');
  await expect(page.getByText(words.title)).toBeVisible();
});
