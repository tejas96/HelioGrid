import {
  createTranslator,
  proposalBatteryNoticeWords,
  proposalBuilderWords,
  proposalCompanyStepWords,
  proposalNoTaxNoticeWords,
  proposalStepListWords,
  proposalStepNames,
  proposalStepWords,
  proposalSystemStepWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll } from '../support/layout';
import { FIRST_NAME, OWNER } from '../support/proposal-builder-sample';
import { CUSTOMER, TAX_NAME } from '../support/proposal-document-sample';
import { expectTouchFloor } from '../support/touch-target';
import { BuilderStory } from './ProposalBuilder.story';

/**
 * The proposal builder's frame and steps (`M06-21`–`M06-25`, `T-M06-002`, `T-M06-005`): any step
 * is reachable in any order, nothing is ever disabled but Back on the first step, a long title is
 * cut in the capsule and read whole in the list, and a figure only the cost's holder may see is
 * not drawn for anyone else.
 */
const en = await createTranslator('en');
const words = proposalBuilderWords(en.t, { name: FIRST_NAME, fullName: CUSTOMER });
const names = proposalStepNames(en.t);
const shared = proposalStepWords(en.t);
const list = proposalStepListWords(en.t, { quick: false });

const PHONE = { width: 375, height: 812 };
const DESK = { width: 1536, height: 960 };

test.describe('on a phone', () => {
  test.use({ viewport: PHONE });

  test('the capsule counts the steps, Next names the next one, and no move is ever blocked', async ({
    mount,
    page,
  }) => {
    const frame = await mount(<BuilderStory step="system" />);
    const capsule = frame.getByRole('button', {
      name: words.openSteps(3, 11, names.system.title),
    });
    await expect(capsule).toContainText(words.count(3, 11));
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(names.system.heading);
    await expectNoSidewaysScroll(page);
    const next = frame.getByRole('button', { name: words.next(names.performance.title) });
    await expectTouchFloor([
      frame.getByRole('button', { name: words.close }),
      capsule,
      frame.getByRole('button', { name: words.preview }),
      frame.getByRole('button', { name: words.back }),
      next,
    ]);
    await next.click();
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(names.performance.heading);
    await frame.getByRole('button', { name: words.back }).click();
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(names.system.heading);
  });

  test('Back is the one inert control, on the first step; the last step opens the check', async ({
    mount,
    page,
  }) => {
    const frame = await mount(<BuilderStory step="company" />);
    await expect(frame.getByRole('button', { name: words.back })).toBeDisabled();
    await frame.unmount();
    const last = await mount(<BuilderStory step="bank" />);
    const generate = last.getByRole('button', { name: words.last });
    await expect(generate).toBeEnabled();
    await generate.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('a long title is cut in the capsule and read whole in the list of every step', async ({
    mount,
    page,
  }) => {
    const long = 'प्रणालीचा आकार, किंमत आणि सरकारी अनुदानाची संपूर्ण माहिती';
    const frame = await mount(<BuilderStory step="system" longTitle={long} />);
    const title = frame.locator('.hg-pbf-capsule-title');
    await expect(title).toHaveText(long);
    const cut = await title.evaluate((node) => node.scrollWidth > node.clientWidth);
    expect(cut).toBe(true);
    await expectNoSidewaysScroll(page);
    await frame.locator('.hg-pbf-capsule').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByText(list.title)).toBeVisible();
    await expect(sheet.getByText(names.system.heading)).toBeVisible();
  });

  test('Quick mode presents four steps and the list offers the rest quietly', async ({
    mount,
    page,
  }) => {
    const frame = await mount(<BuilderStory step="system" quick />);
    await expect(frame.locator('.hg-pbf-capsule')).toContainText(words.count(2, 4));
    await expect(frame.locator('.hg-pbf-track-part')).toHaveCount(4);
    await frame.locator('.hg-pbf-capsule').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.locator('.hg-pbf-steprow')).toHaveCount(11);
    await expect(sheet.locator('.hg-pbf-steprow-in[data-quiet]')).toHaveCount(7);
    /* Opening a hidden step is the expansion: the full rail takes over, nothing re-entered. */
    await sheet.getByText(names.timeline.heading).click();
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(names.timeline.heading);
    await expect(frame.locator('.hg-pbf-capsule')).toContainText(words.count(6, 11));
  });

  test('the save state says what the last commit came to', async ({ mount }) => {
    const saved = await mount(<BuilderStory step="system" />);
    await expect(saved.getByRole('status').filter({ hasText: words.saved })).toBeVisible();
    await saved.unmount();
    const unsaved = await mount(<BuilderStory step="system" save="unsaved" />);
    await expect(unsaved.getByText(words.unsaved(1))).toBeVisible();
    await unsaved.unmount();
    const offline = await mount(<BuilderStory step="system" save="offline" />);
    await expect(offline.getByText(words.offline)).toBeVisible();
  });

  test('a step still loading says so, and one that failed offers its retry', async ({ mount }) => {
    const loading = await mount(<BuilderStory step="system" read="loading" />);
    await expect(loading.getByRole('status', { name: shared.loading })).toBeVisible();
    await expect(loading.getByRole('heading', { level: 1 })).toHaveText(names.system.heading);
    await loading.unmount();
    const failed = await mount(<BuilderStory step="system" read="failed" />);
    await expect(failed.getByText(shared.failedTitle)).toBeVisible();
    await failed.getByRole('button', { name: shared.retry }).click();
    await expect(failed.page().getByTestId('log')).toHaveText('retried');
  });

  test('a lead that moved away says who holds it now', async ({ mount }) => {
    const frame = await mount(<BuilderStory step="system" moved />);
    await expect(frame.getByText(shared.moved('Priya Kulkarni').title)).toBeVisible();
  });
});

test.describe('step 3', () => {
  test.use({ viewport: PHONE });
  const system = (owner: boolean) =>
    proposalSystemStepWords(en.t, {
      name: FIRST_NAME,
      taxName: TAX_NAME,
      taxRateText: '8.9%',
      taxRegistered: true,
      supplyPhase: 'single',
      maintenance: { kind: 'none', years: null },
      ...(owner ? { ourCostText: '₹1,40,000' } : {}),
    });

  test('our cost is drawn for its holder and absent for everyone else', async ({ mount }) => {
    const rep = await mount(<BuilderStory step="system" />);
    await expect(rep.getByText(system(false).discount, { exact: true })).toBeVisible();
    await expect(rep.getByText(system(false).ourCost, { exact: true })).toHaveCount(0);
    await rep.unmount();
    const owner = await mount(<BuilderStory step="system" kase="owner" />);
    await expect(owner.getByText(system(true).ourCost, { exact: true })).toBeVisible();
    await expect(owner.getByText(system(true).ourCostValue)).toBeVisible();
  });

  test('an off-grid system with no battery says so at once, and offers no incentive', async ({
    mount,
  }) => {
    const frame = await mount(<BuilderStory step="system" kase="offgrid" />);
    await expect(frame.getByText(proposalBatteryNoticeWords(en.t, 'off_grid').title)).toBeVisible();
    await expect(frame.getByRole('switch')).toHaveCount(0);
  });

  test('a company with no tax registration is told why no tax prints', async ({ mount }) => {
    const frame = await mount(<BuilderStory step="system" kase="notax" />);
    await expect(
      frame.getByText(proposalNoTaxNoticeWords(en.t, { taxName: TAX_NAME, owner: OWNER }).title),
    ).toBeVisible();
  });

  test('one folded row is open at a time', async ({ mount }) => {
    const frame = await mount(<BuilderStory step="system" />);
    const words3 = system(false);
    const discount = frame.getByRole('button', { name: new RegExp(words3.discount) });
    const supply = frame.getByRole('button', { name: new RegExp(words3.supply) });
    await discount.click();
    await expect(discount).toHaveAttribute('aria-expanded', 'true');
    await supply.click();
    await expect(supply).toHaveAttribute('aria-expanded', 'true');
    await expect(discount).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('on a desktop', () => {
  test.use({ viewport: DESK });

  test('the rail names every step with its standing, and the stage shows the page', async ({
    mount,
    page,
  }) => {
    const frame = await mount(<BuilderStory step="system" wide />);
    const rail = frame.getByRole('navigation', { name: words.steps });
    await expect(rail.getByRole('button')).toHaveCount(11);
    await expect(
      rail.getByRole('button', { name: words.spokenStep(names.system.title, 'done') }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      rail.getByRole('button', { name: words.spokenStep(names.components.title, 'to_do') }),
    ).toBeVisible();
    await expect(frame.getByText(words.stepOf(3, 11))).toBeVisible();
    await expect(frame.getByRole('region', { name: words.whatSees })).toBeVisible();
    await expect(frame.getByText(words.pays)).toBeVisible();
    await expectNoSidewaysScroll(page);
    await rail.getByRole('button', { name: new RegExp(names.terms.title) }).click();
    await expect(frame.getByRole('heading', { level: 1 }).last()).toHaveText(names.terms.heading);
  });

  test('step 1 locks the company facts and names who can change them', async ({ mount }) => {
    const frame = await mount(<BuilderStory step="company" wide />);
    const company = proposalCompanyStepWords(en.t, { name: FIRST_NAME, owner: OWNER });
    await expect(frame.getByText(company.factsLine)).toBeVisible();
    await expect(
      frame.getByRole('radiogroup', { name: company.cover }).getByRole('radio'),
    ).toHaveCount(4);
    await expect(frame.getByRole('textbox')).toHaveCount(0);
  });
});
