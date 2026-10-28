import { TYPICAL_SYSTEM_KWP } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
  companyProfileWords,
  createTranslator,
  SETUP_WHAT_YOU_SELL,
  tierLabel,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import {
  bottomOf,
  expectNoSidewaysScroll,
  expectNothingClipped,
  expectSharedEdge,
  rightOf,
  settledBox,
} from '../support/layout';
import { resolvedColour } from '../support/token';
import { expectTouchFloor, MIN_TOUCH_TARGET } from '../support/touch-target';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile's what-you-sell part at the board's phone width (`SCR-M01-05`,
 * `m-declarations-open`, `m-failed-save` and the two language frames; `M01-23`): the kind of
 * business as three cards in one column, the typical size with its steppers and its tier, and one
 * line at the act. A size nobody declared shows no tier.
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const en = READERS.en;

test.use({ viewport: { width: 375, height: 812 } });

const COLUMN = 335;
const FIELD = 54;
/* A unit is a quantity's symbol, never translated, so it is written as the product writes it. */
const UNIT = 'kWp';

const SIZE = en.t(SETUP_WHAT_YOU_SELL.sizeLabel);
const SAVE = en.t(COMPANY_PROFILE.saveSpoken);
const SELLS = en.t(COMPANY_PROFILE_PART_TITLE.declarations);
const NOT_DECLARED = en.t(COMPANY_PROFILE_STANDING_WORD.not_declared);
const RESEED = en.t(COMPANY_PROFILE.reseedScope);
const MARKET_DEFAULTS = en.t(COMPANY_PROFILE.marketDefaults);
/* The tier's word and its source; the component draws the dot between them. */
const TIER_LINE = [tierLabel(en.t, 'estimated'), en.t(SETUP_WHAT_YOU_SELL.declaredByYou)];

/* The three kinds as the screen's words give them: the one vocabulary's title, this screen's line. */
const KINDS = companyProfileWords(en.t, {
  life: 'setup',
  status: 'ready',
  skipped: false,
  arrivedUndeclared: false,
  standings: {
    identity: 'name_only',
    address: 'city_only',
    tax: 'not_added',
    bank: 'not_added',
    declarations: 'answered',
  },
  open: 'declarations',
  city: '',
  taxIdLabel: '',
  taxFormat: '',
  bankRoutingLabel: '',
  letterhead: { companyName: '', addressLine: '', registration: null, bank: null },
  logo: null,
}).declarations.options;

/* Two lines of text stand more than twice their font size tall; a box under that holds one line. */
const TWO_LINES = 2;
const fontSizeOf = (text: Locator) =>
  text.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));

/** The part's controls, by what a person reads. */
function partsOf(profile: Locator) {
  return {
    cards: profile.getByRole('radio'),
    size: profile.getByRole('textbox', { name: SIZE }),
    steppers: profile.locator('.hg-number-field-step'),
    tier: profile.locator('.hg-provenance'),
  };
}

test('what you sell holds the kind as three cards in one column and the size with its steppers, its tier and its hint, over the act’s one line', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" open="declarations" />);
  const { cards, size, steppers, tier } = partsOf(profile);
  await expect(
    profile.getByRole('radiogroup', { name: en.t(COMPANY_PROFILE.group) }),
  ).toBeVisible();
  await expect(cards).toHaveCount(3);
  expect(KINDS.map((kind) => kind.value)).toEqual(['residential', 'ci', 'both']);
  for (const [index, kind] of KINDS.entries()) {
    await expect(cards.nth(index).locator('.hg-option-card-title')).toHaveText(kind.title);
    await expect(cards.nth(index).locator('.hg-option-card-description')).toHaveText(
      kind.description,
    );
    expect((await settledBox(cards.nth(index)))?.width).toBe(COLUMN);
  }
  await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'left');
  expect(await bottomOf(cards.nth(0))).toBeLessThan((await settledBox(cards.nth(1)))?.y ?? 0);
  await expect(cards.nth(0)).toBeChecked();

  await expect(size).toHaveValue('5');
  const box = profile.locator('.hg-number-field-box');
  expect(await settledBox(box)).toMatchObject({ width: COLUMN, height: FIELD });
  await expect(box.getByText(UNIT, { exact: true })).toBeVisible();
  await expect(steppers).toHaveCount(2);
  for (const index of [0, 1]) {
    expect(await settledBox(steppers.nth(index))).toMatchObject({
      width: MIN_TOUCH_TARGET,
      height: FIELD,
    });
  }
  for (const word of TIER_LINE) await expect(tier).toContainText(word);
  await expect(tier).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
  expect((await settledBox(tier))?.y).toBeGreaterThanOrEqual(await bottomOf(box));
  await expect(profile.getByText(en.t(COMPANY_PROFILE.sizeHint))).toBeVisible();

  const act = profile.getByRole('button', { name: SAVE });
  await expect(act).toBeEnabled();
  const line = profile.getByText(RESEED);
  expect((await settledBox(line))?.y).toBeGreaterThanOrEqual(await bottomOf(act));
  await expectNoSidewaysScroll(page);
});

test('a pressed card reports its kind, a typed size is reported as typed, and each stepper moves it by the size’s step, never under nothing', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" open="declarations" />);
  const { cards, size, steppers } = partsOf(profile);
  await cards.nth(2).click();
  await expect(profile.getByTestId('segment')).toHaveText('both');
  await expect(cards.nth(2)).toBeChecked();

  await size.fill('7.25');
  await expect(profile.getByTestId('size')).toHaveText('7.25');
  await steppers.last().click();
  await expect(profile.getByTestId('size')).toHaveText(String(7.25 + TYPICAL_SYSTEM_KWP.step));
  await steppers.first().click();
  await steppers.first().click();
  await expect(profile.getByTestId('size')).toHaveText(String(7.25 - TYPICAL_SYSTEM_KWP.step));

  await size.fill(String(TYPICAL_SYSTEM_KWP.step / 2));
  await steppers.first().click();
  await expect(profile.getByTestId('size')).toHaveText('0');
  await steppers.first().click();
  await expect(profile.getByTestId('size')).toHaveText('0');
  /* Nothing is no declaration: the field drops its tier as the header turns. */
  await expect(profile.locator('.hg-provenance')).toHaveCount(0);
});

test('an owner whose answers did not save reads that in the lede, meets the part open and owed with nothing chosen and no tier, and a live act that says what it costs', async ({
  mount,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" undeclared open={null} />);
  const { cards, size, tier } = partsOf(profile);
  await expect(profile.getByText(en.t(COMPANY_PROFILE.ledeNotSaved))).toBeVisible();
  await expect(profile.getByTestId('open')).toHaveText('declarations');
  const sells = profile.locator('.hg-accordion-toggle').filter({ hasText: SELLS });
  await expect(sells).toContainText(NOT_DECLARED);

  await expect(cards).toHaveCount(3);
  for (const index of [0, 1, 2]) await expect(cards.nth(index)).not.toBeChecked();
  await expect(size).toHaveValue('');
  await expect(tier).toHaveCount(0);
  await expect(profile.getByText(TIER_LINE[1] ?? '')).toHaveCount(0);
  const act = profile.getByRole('button', { name: SAVE });
  await expect(act).toBeEnabled();
  expect((await settledBox(profile.getByText(MARKET_DEFAULTS)))?.y).toBeGreaterThanOrEqual(
    await bottomOf(act),
  );

  await cards.nth(0).click();
  await size.fill('5');
  await expect(profile.getByText(en.t(COMPANY_PROFILE.lede))).toBeVisible();
  await expect(profile.getByText(MARKET_DEFAULTS)).toHaveCount(0);
  await expect(profile.getByText(RESEED)).toBeVisible();
  await expect(sells).not.toContainText(NOT_DECLARED);
  for (const word of TIER_LINE) await expect(tier).toContainText(word);
});

for (const reader of ['hi', 'mr'] as const) {
  test(`in ${reader} what you sell holds every card title on one line, clips nothing, and keeps the act and its one line on screen`, async ({
    mount,
    page,
  }) => {
    const { t } = READERS[reader];
    const profile = await mount(<CompanyProfileAsHeld reader={reader} open="declarations" />);
    const { cards } = partsOf(profile);
    await expect(cards).toHaveCount(3);
    const titles = profile.locator('.hg-option-card-title');
    for (const index of [0, 1, 2]) {
      expect((await settledBox(cards.nth(index)))?.width).toBe(COLUMN);
      expect((await settledBox(titles.nth(index)))?.height).toBeLessThan(
        TWO_LINES * (await fontSizeOf(titles.nth(index))),
      );
    }
    /* Four shut parts, each standing inside its own header on both axes. */
    const standings = profile.locator('.hg-accordion-standing');
    await expect(standings).toHaveCount(4);
    for (const header of await profile.locator('.hg-accordion-toggle').all()) {
      const standing = header.locator('.hg-accordion-standing');
      if ((await standing.count()) === 0) continue;
      expect(await rightOf(standing)).toBeLessThanOrEqual(await rightOf(header));
      expect(await bottomOf(standing)).toBeLessThanOrEqual(await bottomOf(header));
    }
    await expectNothingClipped(
      page,
      '.hg-text, .hg-accordion-toggle, .hg-option-card-title, .hg-option-card-description, .hg-number-field-label',
    );

    const act = profile.locator('.hg-door-footer').getByRole('button');
    await expect(act).toBeInViewport();
    const line = profile.getByText(t(COMPANY_PROFILE.reseedScope));
    await expect(line).toBeInViewport();
    expect((await settledBox(line))?.height).toBeLessThan(TWO_LINES * (await fontSizeOf(line)));
    await expectNoSidewaysScroll(page);
  });
}

for (const state of [
  { name: 'the tax part', open: 'tax', fields: 1, cards: 0, sizes: 0, steppers: 0 },
  { name: 'what you sell', open: 'declarations', fields: 0, cards: 3, sizes: 1, steppers: 2 },
] as const) {
  test(`in ${state.name}, every header, field, card, stepper and act meets the touch floor`, async ({
    mount,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" open={state.open} />);
    const kinds = [
      [profile.locator('.hg-accordion-toggle'), 5],
      [profile.locator('.hg-input-shell'), state.fields],
      [profile.locator('.hg-option-card'), state.cards],
      [profile.locator('.hg-number-field-box'), state.sizes],
      [profile.locator('.hg-number-field-step'), state.steppers],
      [profile.locator('.hg-button'), 1],
    ] as const;
    for (const [targets, expected] of kinds) {
      await expect(targets).toHaveCount(expected);
      if (expected > 0) await expectTouchFloor(await targets.all());
    }
  });
}
