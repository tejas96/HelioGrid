import type { ProposalStep } from '@heliogrid/domain';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import type { BuilderCase } from '../support/proposal-builder-sample';
import { refusalOf } from '../support/proposal-step-cases';
import { StepRefusedStory } from './ProposalStepRefused.story';

/**
 * Every field a step saves draws the server's refusal at itself (`F8-36`, `T-M06-023`): the web
 * half of each step reads its view's `saves`, which `fieldStateOf` fills, and says the reason — a
 * folded field once its row is opened — never a plain *not saved*.
 */
test.use({ viewport: { width: 375, height: 812 } });

const FIELDS: readonly (readonly [ProposalStep, string, BuilderCase?])[] = [
  ['achievements', 'about'],
  ['achievements', 'totalCapacityInstalledKw'],
  ['achievements', 'happyCustomers'],
  ['achievements', 'citiesServed'],
  ['system', 'capacity'],
  ['system', 'price'],
  ['system', 'discount'],
  ['system', 'sanctionedLoad'],
  ['system', 'ourCost'],
  ['performance', 'efficiency'],
  ['performance', 'months'],
  ['financials', 'monthlyBill'],
  ['financials', 'tariff'],
  ['financials', 'tariffRise'],
  ['financials', 'horizon'],
  ['components', 'components'],
  ['terms', 'terms'],
  ['client', 'address'],
  ['client', 'area'],
  ['bank', 'bankName'],
  ['bank', 'accountName'],
  ['bank', 'accountNumber'],
  ['bank', 'bankRoutingIdentifier'],
];

/** Opens each folded row in turn until the reason shows; one row is open at a time. */
async function revealed(page: Page, reason: string): Promise<boolean> {
  const said = page.getByText(reason);
  if (await said.isVisible()) return true;
  const folds = page.locator('[aria-expanded]');
  for (let at = 0; at < (await folds.count()); at += 1) {
    const fold = folds.nth(at);
    if ((await fold.getAttribute('aria-expanded')) === 'false') await fold.click();
    if (await said.isVisible()) return true;
  }
  return false;
}

for (const [step, field, kase] of FIELDS) {
  test(`step ${step}: a refused ${field} says the server’s reason at the field`, async ({
    mount,
    page,
  }) => {
    await mount(<StepRefusedStory step={step} field={field} {...(kase ? { kase } : {})} />);
    expect(await revealed(page, refusalOf(field))).toBe(true);
  });
}
