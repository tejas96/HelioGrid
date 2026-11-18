import { PROPOSAL_LIMITS } from '@heliogrid/domain';
import {
  createTranslator,
  proposalCheckWords,
  proposalPartAddWords,
  proposalPartEditWords,
  proposalPartPickerWords,
  proposalPaymentPartWords,
  proposalReadyWords,
  proposalStartWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll } from '../support/layout';
import { FIRST_NAME } from '../support/proposal-builder-sample';
import { NUMBER } from '../support/proposal-document-sample';
import { ReadyStory, SheetStory } from './ProposalBuilderSheets.story';

/**
 * The builder's sheets (`M06-23`, `M06-27`–`M06-29`, `T-M06-001`, `T-M06-022`): the picker holds
 * three brands and says so, the edit sheet keeps the brand fixed and the description to its limit,
 * the check never offers a dead Generate, and the start sheet starts in the mode it shows.
 */
const en = await createTranslator('en');
const max = PROPOSAL_LIMITS.brandsPerCategory;
const log = (page: import('@playwright/test').Page) => page.getByTestId('log');

test.use({ viewport: { width: 375, height: 812 } });

test('the picker ticks up to three brands, then says why a fourth is inert', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="picker" />);
  const sheet = page.getByRole('dialog');
  const words = (picked: number) =>
    proposalPartPickerWords(en.t, { category: 'panel', picked, max, scheme: 'DCR', canAdd: true });
  await expect(sheet.getByRole('button', { name: words(1).done })).toBeVisible();
  const options = sheet.getByRole('checkbox');
  await expect(options).toHaveCount(4);
  await options.nth(1).click();
  await options.nth(2).click();
  await expect(sheet.getByText(words(3).full)).toBeVisible();
  await expect(options.nth(3)).toBeDisabled();
  await expect(sheet.getByRole('button', { name: words(3).done })).toBeVisible();
  await expect(sheet.getByText(words(3).scheme ?? '')).toBeVisible();
  await expectNoSidewaysScroll(page);
  await options.nth(2).click();
  await expect(options.nth(3)).toBeEnabled();
});

test('the edit sheet keeps the brand fixed and the customer line to its limit', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="edit" />);
  const sheet = page.getByRole('dialog');
  const words = proposalPartEditWords(en.t, { brand: 'Waaree', category: 'panel' });
  await expect(sheet.getByText(words.brandFixed)).toBeVisible();
  await expect(sheet.getByRole('textbox', { name: 'Waaree' })).toHaveCount(0);
  const line = sheet.locator('textarea');
  const max = PROPOSAL_LIMITS.componentDescription;
  // The count is the label's tag, once; a paste past the limit keeps its first `max` characters.
  await line.fill('x'.repeat(max + 5));
  await expect(line).toHaveValue('x'.repeat(max));
  await expect(sheet.getByText(words.descriptionCount(max, max))).toHaveCount(1);
  await line.fill('Made in Gujarat');
  await sheet.getByRole('button', { name: words.done }).click();
  await expect(log(page)).toHaveText('edited:Made in Gujarat');
});

test('a blocked check lists every failure and its main act goes to the first', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="check" />);
  const sheet = page.getByRole('dialog');
  const words = proposalCheckWords(en.t, {
    check: { kind: 'blocked', blocks: 2, warnings: 1, firstStep: 'Components' },
    quick: false,
  });
  await expect(sheet.getByText(words.title)).toBeVisible();
  await expect(sheet.locator('.hg-pchk-find')).toHaveCount(3);
  await expect(sheet.getByText(words.warningsOver)).toBeVisible();
  await expect(sheet.getByRole('button', { name: words.generate })).toHaveCount(0);
  await sheet.getByRole('button', { name: words.goToFirst }).click();
  await expect(log(page)).toHaveText('fix:structure');
  await sheet.locator('.hg-pchk-find').nth(1).click();
  await expect(log(page)).toHaveText('fix:tranches');
});

test('a clear check shows what will be generated; warnings never stop it', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="check-warn" />);
  const sheet = page.getByRole('dialog');
  const words = proposalCheckWords(en.t, {
    check: { kind: 'clear', warnings: 1, generating: false, pages: 9 },
    quick: false,
  });
  const generate = sheet.getByRole('button', { name: words.generateAnyway });
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(log(page)).toHaveText('generate');
});

test('from version 2 on the clear check asks what changed, and says so when it is left empty', async ({
  mount,
  page,
}) => {
  const note = proposalCheckWords(en.t, {
    check: { kind: 'clear', warnings: 0, generating: false, pages: 9 },
    quick: false,
  }).changeNote(2);
  const asked = await mount(<SheetStory sheet="check-note" />);
  const field = page.getByRole('dialog').getByRole('textbox', { name: note.label });
  await expect(field).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(note.hint);
  await field.fill('Bigger inverter');
  await expect(log(page)).toHaveText('note:Bigger inverter');
  await expectNoSidewaysScroll(page);
  await asked.unmount();

  await mount(<SheetStory sheet="check-note-missing" />);
  await expect(page.getByRole('dialog')).toContainText(note.missing);
});

test('a payment part takes a name and a stage from the stages offered, and no other', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="part" />);
  const words = proposalPaymentPartWords(en.t, { number: 5, isNew: true });
  const sheet = page.getByRole('dialog', { name: words.title });
  const name = sheet.getByRole('textbox', { name: words.name });
  await name.fill('Retention');
  await sheet.getByRole('combobox', { name: words.due }).click();
  const offered = page.getByRole('option');
  await expect(offered).toHaveText(['On signing', 'On installation', 'On handover']);
  await offered.filter({ hasText: 'On installation' }).click();
  await sheet.getByRole('button', { name: words.done }).click();
  await expect(log(page)).toHaveText('part:Retention:installation');

  await name.fill('   ');
  await expect(sheet.getByRole('button', { name: words.done })).toBeDisabled();
});

test('at the plan limit the sheet says what still works and keeps the draft', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="check-limit" />);
  const sheet = page.getByRole('dialog');
  const words = proposalCheckWords(en.t, {
    check: { kind: 'limit' },
    quick: false,
    plan: { counts: { used: 40, limit: 40 }, resetsOn: '1 Dec' },
    planOwner: 'Suresh Kulkarni',
  });
  await expect(sheet.getByText(words.limit.used)).toBeVisible();
  await expect(sheet.getByText(words.limit.stillWorks)).toHaveCount(3);
  await expect(sheet.getByText(words.note)).toBeVisible();
  await expect(sheet.locator('.hg-button', { hasText: words.limit.close })).toBeVisible();
});

test('the start sheet starts in the mode it shows, or copies a recent proposal', async ({
  mount,
  page,
}) => {
  await mount(<SheetStory sheet="start" />);
  const sheet = page.getByRole('dialog');
  const words = proposalStartWords(en.t, { name: FIRST_NAME, segment: 'residential' });
  await expect(
    sheet.getByRole('radio', { name: new RegExp(words.modes.quick.title) }),
  ).toBeChecked();
  await sheet.getByRole('radio', { name: new RegExp(words.modes.full.title) }).click();
  await sheet.getByRole('button', { name: words.start }).click();
  await expect(log(page)).toHaveText('start:full');
  await sheet.getByText(words.sameAs('Rohan Kale')).click();
  await expect(log(page)).toHaveText('copy:b');
});

test('the start sheet offers With 3D design only to who may design, and starts it', async ({
  mount,
  page,
}) => {
  const words = proposalStartWords(en.t, { name: FIRST_NAME, segment: 'residential' });
  const designing = await mount(<SheetStory sheet="start" />);
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('radio', { name: new RegExp(words.modes.design.title) }).click();
  await sheet.getByRole('button', { name: words.start }).click();
  await expect(log(page)).toHaveText('start:design');
  await designing.unmount();
  await mount(<SheetStory sheet="start" canDesign={false} />);
  await expect(page.getByRole('dialog').getByRole('radio')).toHaveCount(2);
  await expect(page.getByText(words.modes.design.title)).toHaveCount(0);
});

test('after Generate the cover lands with the number and the two ways on', async ({
  mount,
  page,
}) => {
  const ready = await mount(<ReadyStory />);
  const words = proposalReadyWords(en.t, {
    name: FIRST_NAME,
    number: NUMBER,
    version: 1,
    amount: '₹1,90,575',
    pages: 9,
  });
  await expect(ready.getByRole('heading', { level: 1 }).last()).toHaveText(words.title);
  // The number and the amount stand as slots in the words; the screen sets them in the mono face.
  const line = words.lineFigures.reduce(
    (said, figure) => said.replace('\u0000', figure),
    words.line,
  );
  await expect(ready.getByText(line)).toBeVisible();
  await expect(ready.getByText(line).getByText('₹1,90,575', { exact: true })).toHaveCSS(
    'font-family',
    /Geist Mono/,
  );
  await expectNoSidewaysScroll(page);
  await ready.getByRole('button', { name: words.share }).click();
  await expect(page.getByTestId('log')).toHaveText('share');
  await ready.getByRole('button', { name: words.download }).click();
  await expect(page.getByTestId('log')).toHaveText('download');
});

/* `T-M06-010`, `M06-28`: a new part is added inline only with the right; the import only by its holder. */
test('the picker offers a new part only to a reader who may add one', async ({ mount, page }) => {
  const words = (canAdd: boolean) =>
    proposalPartPickerWords(en.t, { category: 'panel', picked: 1, max, scheme: 'DCR', canAdd });
  const allowed = await mount(<SheetStory sheet="picker" />);
  await expect(page.getByRole('dialog').getByText(words(true).add)).toBeVisible();
  await allowed.unmount();
  await mount(<SheetStory sheet="picker" addsParts={false} />);
  await expect(page.getByRole('dialog').getByText(words(false).add)).toHaveCount(0);
});

test('the add sheet offers the spreadsheet only to the catalog’s holder', async ({
  mount,
  page,
}) => {
  const words = proposalPartAddWords(en.t, { category: 'panel', scheme: 'DCR' });
  const seller = await mount(<SheetStory sheet="add" />);
  await expect(page.getByRole('dialog').getByText(words.sheet)).toHaveCount(0);
  await seller.unmount();
  await mount(<SheetStory sheet="add" kase="owner" />);
  await page.getByRole('dialog').getByText(words.sheet).click();
  await expect(log(page)).toHaveText('spreadsheet');
});
