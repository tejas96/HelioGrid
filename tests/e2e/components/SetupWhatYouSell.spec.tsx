import {
  createTranslator,
  SETUP_LANGUAGE,
  SETUP_WHAT_YOU_SELL,
  SIGN_IN,
  tierLabel,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { bottomOf, expectNoSidewaysScroll, expectSharedEdge, rightOf } from '../support/layout';
import { resolvedColour } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';
import { WhatYouSellStepAsHeld } from './SetupWhatYouSell.story';

/**
 * The what-you-sell step at the board's two widths (`SCR-M01-04`): two questions in one column
 * with the way on held on screen; at 1536 the cards stay a stacked list beside the question, at the
 * frame's `list` measure. The size is an empty box under its tier line until it is declared. A
 * refused `Continue` rings what is owed and moves focus there; a failed save takes the heading and
 * keeps both answers.
 */
const en = await createTranslator('en');

const SIZE = en.t(SETUP_WHAT_YOU_SELL.sizeLabel);
const CONTINUE = en.t(SETUP_LANGUAGE.continue);
const SAVES_BOTH = en.t(SETUP_WHAT_YOU_SELL.savesBoth);
const TRY_AGAIN = en.t(SIGN_IN.tryAgain);
const FINISH_LATER = en.t(SETUP_WHAT_YOU_SELL.finishLater);
/* A unit is a quantity's symbol, never translated, so it is written as the product writes it. */
const UNIT = 'kWp';
/* The tier's word and its source; the component draws the dot between them. */
const TIER_LINE = [tierLabel(en.t, 'estimated'), en.t(SETUP_WHAT_YOU_SELL.declaredByYou)];

/** The step's parts, by what a person reads. */
function partsOf(step: Locator) {
  return {
    cards: step.getByRole('radio'),
    group: step.getByRole('radiogroup'),
    size: step.getByRole('textbox', { name: SIZE }),
    tier: step.locator('.hg-provenance'),
  };
}

test.describe('at 375', () => {
  const HEIGHT = 812;
  test.use({ viewport: { width: 375, height: HEIGHT } });

  test('the two questions are one column: three cards, the helper line over the field, and the way on on screen', async ({
    mount,
    page,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" />);
    const { cards, size } = partsOf(step);
    await expect(cards).toHaveCount(3);
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'left');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'right');
    expect(await bottomOf(cards.nth(0))).toBeLessThan((await cards.nth(1).boundingBox())?.y ?? 0);

    const helper = step.getByText(en.t(SETUP_WHAT_YOU_SELL.sizeHelper));
    expect(await bottomOf(helper)).toBeLessThanOrEqual((await size.boundingBox())?.y ?? 0);

    const way = step.getByRole('button', { name: CONTINUE });
    expect((await way.boundingBox())?.width).toBe((await cards.nth(0).boundingBox())?.width);
    expect(await bottomOf(step.getByText(SAVES_BOTH))).toBeLessThanOrEqual(HEIGHT);
    await expectNoSidewaysScroll(page);
  });

  for (const state of [
    { name: 'at rest', props: {} },
    { name: 'while the stored answers are read', props: { checking: true } },
    { name: 'after a failed save', props: { failed: true } },
  ]) {
    test(`${state.name}, an undeclared size is an empty box beside its unit, under its tier line in the secondary role`, async ({
      mount,
      page,
    }) => {
      const step = await mount(<WhatYouSellStepAsHeld reader="en" {...state.props} />);
      const { size, tier } = partsOf(step);
      await expect(size).toHaveValue('');
      await expect(step.locator('.hg-number-field').getByText('0', { exact: true })).toHaveCount(0);
      await expect(step.getByText(UNIT, { exact: true })).toBeVisible();
      for (const word of TIER_LINE) await expect(tier).toContainText(word);
      await expect(tier).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
    });
  }

  test('a size is reported as it is typed, once, before the field is left, and a tap on a card reports its kind', async ({
    mount,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" />);
    const { cards, size, tier } = partsOf(step);
    await size.fill('5');
    await expect(step.getByTestId('size')).toHaveText('5');
    await size.blur();
    await expect(step.getByTestId('declarations')).toHaveText('1');
    await expect(size).toHaveValue('5');
    for (const word of TIER_LINE) await expect(tier).toContainText(word);

    await cards.nth(1).click();
    await expect(step.getByTestId('segment')).toHaveText('ci');
    await expect(cards.nth(1)).toBeChecked();
  });

  test('while the stored answers are read, the way on is off, says why, and stays reachable; the questions stay live', async ({
    mount,
  }) => {
    const step = await mount(
      <WhatYouSellStepAsHeld reader="en" checking segment="both" size={5} />,
    );
    const way = step.getByRole('button', { name: CONTINUE });
    await expect(way).toHaveAttribute('aria-disabled', 'true');
    await expect(way).toHaveJSProperty('disabled', false);
    await expect(step.getByText(en.t(SETUP_WHAT_YOU_SELL.stillChecking))).toBeVisible();
    await expect(step.getByText(SAVES_BOTH)).toHaveCount(0);
    await way.focus();
    await expect(way).toBeFocused();
    await way.click({ force: true });
    await expect(step.getByTestId('pressed')).toHaveText('');

    await partsOf(step).cards.nth(0).click();
    await expect(step.getByTestId('segment')).toHaveText('residential');
  });

  test('a refused Continue rings both questions, says each fix, drops the line at the act, and moves focus to the first card', async ({
    mount,
    page,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" />);
    const { cards, group, size, tier } = partsOf(step);
    await step.getByRole('button', { name: CONTINUE }).click();

    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(size).toHaveAttribute('aria-invalid', 'true');
    for (const word of TIER_LINE) await expect(tier).toContainText(word);
    await expect(tier).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
    await expect(step.getByText(en.t(SETUP_WHAT_YOU_SELL.pickOne))).toBeVisible();
    await expect(step.getByText(en.t(SETUP_WHAT_YOU_SELL.addSize))).toBeVisible();
    await expect(step.getByText(SAVES_BOTH)).toHaveCount(0);
    await expect(cards.nth(0)).toBeFocused();
    await expect(step.getByTestId('pressed')).toHaveText('');
  });

  test('with the kind chosen, a refused Continue rings the size alone and moves focus into it', async ({
    mount,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" segment="both" size={0} />);
    const { group, size } = partsOf(step);
    await step.getByRole('button', { name: CONTINUE }).click();

    await expect(group).not.toHaveAttribute('aria-invalid');
    await expect(size).toHaveAttribute('aria-invalid', 'true');
    await expect(size).toBeFocused();
  });

  test('a failed save is one block — the heading and the fix said as one alert, its ask at the row’s far end; both answers stay, and two ways on stand in one row of one width, every control at the touch floor', async ({
    mount,
    page,
  }) => {
    const step = await mount(
      <WhatYouSellStepAsHeld reader="en" failed segment="residential" size={5} />,
    );
    const { cards, size } = partsOf(step);
    const alert = step.getByRole('alert');
    const heading = alert.getByRole('heading', { level: 1 });
    const ask = step.getByRole('button', { name: en.t(SETUP_WHAT_YOU_SELL.errorAskLabel) });
    await expect(step.getByRole('heading')).toHaveCount(1);
    await expect(heading).toHaveText(en.t(SETUP_WHAT_YOU_SELL.notSavedTitle));
    await expect(heading).toHaveCSS('color', await resolvedColour(page, '--danger-text'));
    await expect(alert).toContainText(en.t(SETUP_WHAT_YOU_SELL.notSavedBody));
    await expect(alert.getByRole('button')).toHaveCount(0);
    expect((await ask.boundingBox())?.x).toBeGreaterThanOrEqual(await rightOf(heading));
    expect(await rightOf(ask)).toBeGreaterThanOrEqual(await rightOf(alert));
    expect(await rightOf(ask)).toBeLessThanOrEqual(await rightOf(cards.nth(0)));
    await expect(cards.nth(0)).toBeChecked();
    await expect(size).toHaveValue('5');

    const again = step.getByRole('button', { name: TRY_AGAIN });
    const later = step.getByRole('button', { name: FINISH_LATER });
    for (const control of [ask, cards.nth(0), cards.nth(1), cards.nth(2), size, again, later]) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
    await expectSharedEdge([again, later], 'top');
    const againBox = await again.boundingBox();
    const laterBox = await later.boundingBox();
    expect(laterBox?.x).toBeGreaterThan((againBox?.x ?? 0) + (againBox?.width ?? 0));
    expect(laterBox?.width).toBe(againBox?.width);
    expect(
      await bottomOf(step.getByText(en.t(SETUP_WHAT_YOU_SELL.untilYouFinish))),
    ).toBeLessThanOrEqual(HEIGHT);

    await again.click();
    await expect(step.getByTestId('pressed')).toHaveText('continue');
    await later.click();
    await expect(step.getByTestId('pressed')).toHaveText('later');
  });

  test('while the answers are saved the primary is busy and the other way on is off', async ({
    mount,
  }) => {
    const step = await mount(
      <WhatYouSellStepAsHeld reader="en" failed saving segment="both" size={5} />,
    );
    await expect(step.getByRole('button', { name: TRY_AGAIN })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    const later = step.getByRole('button', { name: FINISH_LATER });
    await expect(later).toBeDisabled();
    await later.click({ force: true });
    await expect(step.getByTestId('pressed')).toHaveText('');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} a failed save keeps both ways on and their line on screen, and nothing scrolls sideways`, async ({
      mount,
      page,
    }) => {
      const words = await createTranslator(reader);
      const step = await mount(
        <WhatYouSellStepAsHeld reader={reader} failed segment="residential" size={5} />,
      );
      const alert = step.getByRole('alert');
      await expect(alert).toContainText(words.t(SETUP_WHAT_YOU_SELL.notSavedTitle));
      await expect(alert).toContainText(words.t(SETUP_WHAT_YOU_SELL.notSavedBody));
      await expect(
        step.getByRole('button', { name: words.t(SETUP_WHAT_YOU_SELL.finishLater) }),
      ).toBeVisible();
      expect(
        await bottomOf(step.getByText(words.t(SETUP_WHAT_YOU_SELL.untilYouFinish))),
      ).toBeLessThanOrEqual(HEIGHT);
      await expect(step.getByText(UNIT, { exact: true })).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('the cards stay one stacked column at the frame’s list measure, beside the question, over the size field', async ({
    mount,
    page,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" />);
    const { cards, size } = partsOf(step);
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'left');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'right');
    expect(await bottomOf(cards.nth(0))).toBeLessThan((await cards.nth(1).boundingBox())?.y ?? 0);

    const door = step.locator('.hg-door');
    await expect(door).toHaveAttribute('data-measure', 'list');
    const measure = await door.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).getPropertyValue('--door-measure')),
    );
    const card = await cards.nth(0).boundingBox();
    expect(card?.width).toBe(measure);
    expect(await bottomOf(cards.nth(2))).toBeLessThan((await size.boundingBox())?.y ?? 0);

    const heading = await step.getByRole('heading', { level: 1 }).boundingBox();
    expect((heading?.x ?? Infinity) + (heading?.width ?? 0)).toBeLessThan(card?.x ?? 0);
    await expectNoSidewaysScroll(page);
  });

  test('the way on stands at the column’s right edge, with its line on the same row at the left', async ({
    mount,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" />);
    const card = partsOf(step).cards.nth(0);
    const way = step.getByRole('button', { name: CONTINUE });
    const line = step.getByText(SAVES_BOTH);
    await expectSharedEdge([card, way], 'right');
    await expectSharedEdge([card, line], 'left');
    const wayBox = await way.boundingBox();
    const lineBox = await line.boundingBox();
    expect((lineBox?.x ?? Infinity) + (lineBox?.width ?? 0)).toBeLessThanOrEqual(wayBox?.x ?? 0);
    expect(lineBox?.y).toBeGreaterThanOrEqual(wayBox?.y ?? Infinity);
    expect(await bottomOf(line)).toBeLessThanOrEqual(await bottomOf(way));
  });

  test('after a failed save the two ways on fill the column as one row of one width, their line under them, and the fix sits beside the cards', async ({
    mount,
  }) => {
    const step = await mount(<WhatYouSellStepAsHeld reader="en" failed segment="ci" size={5} />);
    const card = partsOf(step).cards.nth(0);
    const again = step.getByRole('button', { name: TRY_AGAIN });
    const later = step.getByRole('button', { name: FINISH_LATER });
    await expectSharedEdge([card, again], 'left');
    await expectSharedEdge([card, later], 'right');
    await expectSharedEdge([again, later], 'top');
    expect((await later.boundingBox())?.width).toBe((await again.boundingBox())?.width);
    const line = await step.getByText(en.t(SETUP_WHAT_YOU_SELL.untilYouFinish)).boundingBox();
    expect(line?.y).toBeGreaterThanOrEqual(await bottomOf(again));

    const fix = step.getByRole('alert');
    expect(await rightOf(fix)).toBeLessThan((await card.boundingBox())?.x ?? 0);
  });
});
