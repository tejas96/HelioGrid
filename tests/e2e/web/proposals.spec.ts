import {
  createTranslator,
  designPageWords,
  proposalListPageWords,
  proposalListWords,
  proposalQuickAddWords,
  proposalStandingWord,
  proposalStartWords,
  QUICK_ADD,
  siteDetailsWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { ownerWithCompany } from '../support/project';
import { CUSTOMER, ownerWithDraft } from '../support/proposal';
import { withoutMapService } from '../support/studio';

/**
 * `/proposals` (`SCR-M06-19`, `M06-48`, `T-M05-001b`): a rep or the owner, come to find a proposal
 * or start one. The lead's draft is on the list by its customer's name with its standing as a word;
 * *New proposal* asks who it is for first, and closing that capture makes neither a lead nor a
 * proposal. *With 3D design* makes a design and opens its Site details, whose Cancel comes back
 * here, where the 3D chip holds the new design and opens it.
 */
const en = await createTranslator('en');
const formats = { money: String, number: String, when: String, ago: String };
const LIST = proposalListWords(en.t, formats, null);
const START = proposalStartWords(en.t, { name: CUSTOMER.name, segment: 'residential' });
const ASK = proposalQuickAddWords(en.t, null);
const SITE = siteDetailsWords(en.t);
const DESIGN = designPageWords(en.t);

/** A design row's name, as its open button speaks it: only the customer's name is read. */
const named = (customerName: string) =>
  ({ customerName }) as Parameters<typeof LIST.design.open>[0];
const PAGE = proposalListPageWords(en.t, formats, { waiting: 0, waitingValue: '0' });

test('the list names the draft by its customer and its standing, and New proposal asks who it is for', async ({
  page,
}) => {
  await ownerWithDraft(page, en);
  await page.goto('/proposals');

  await expect(page.getByRole('heading', { name: PAGE.title, level: 1 })).toBeVisible();
  await expect(page.getByText(CUSTOMER.name).first()).toBeVisible();
  await expect(page.getByText(proposalStandingWord(en.t, 'draft')).first()).toBeVisible();
  await expect(page.getByText(LIST.filter('waiting')).first()).toBeVisible();

  await page.getByRole('button', { name: PAGE.newProposal }).click();
  const capture = page.getByRole('dialog', { name: proposalQuickAddWords(en.t, null).title });
  await expect(capture).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(capture).toBeHidden();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('With 3D design makes a design, Cancel on Site details comes back here, and the 3D chip holds it', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  await withoutMapService(page);
  await page.goto('/proposals');

  await page.getByRole('button', { name: PAGE.newProposal }).click();
  const capture = page.getByRole('dialog', { name: ASK.title });
  await capture.getByRole('textbox', { name: en.t(QUICK_ADD.name) }).fill(CUSTOMER.name);
  await capture.getByRole('textbox', { name: en.t(QUICK_ADD.phone) }).fill(freshMobile().national);
  await capture.getByRole('button', { name: ASK.save }).click();

  const sheet = page.getByRole('dialog', { name: START.title });
  await sheet.getByRole('radio', { name: new RegExp(START.modes.design.title) }).click();
  await sheet.getByRole('button', { name: START.start }).click();
  await expect(page).toHaveURL(/\/designs\/[0-9a-f-]{36}\/site\?from=proposals$/);

  await page.getByRole('button', { name: SITE.cancel }).click();
  await expect(page).toHaveURL(/\/proposals$/);
  const threeD = page.getByRole('button', { name: new RegExp(`^${LIST.filter('3d')}`) });
  await threeD.click();
  await expect(page.getByText(LIST.design.noPanels).first()).toBeVisible();
  await expect(page.getByText(proposalStandingWord(en.t, 'draft'))).toHaveCount(0);

  // A table row opens through its named button, as a keyboard user does (tests/e2e/CLAUDE.md).
  const open = page.getByRole('button', { name: LIST.design.open(named(CUSTOMER.name)) });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/designs\/[0-9a-f-]{36}\?from=proposals$/);
  await expect(page.getByText(DESIGN.named(1)).first()).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
