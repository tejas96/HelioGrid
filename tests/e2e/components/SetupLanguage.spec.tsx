import { createTranslator, LANGUAGE_META, SETUP_LANGUAGE, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectSharedEdge } from '../support/layout';
import { MIN_TOUCH_TARGET } from '../support/touch-target';
import { LanguageStepAsHeld } from './SetupLanguage.story';

/**
 * The language step at the board's two widths (`SCR-M01-03`), and between them: the languages are
 * one column, with the way on held on screen, until the door's breakpoint and a task column at its
 * whole measure; at 1536 the set is one row of three cards beside the question, and the ways on
 * stand at their own width. A failed save is an alert
 * with two ways on; a device outside the set is a status, with its pill on English.
 */
const en = await createTranslator('en');

const ASK = en.t(SETUP_LANGUAGE.askLabel);
const CONTINUE = en.t(SETUP_LANGUAGE.continue);
const TRY_AGAIN = en.t(SIGN_IN.tryAgain);
const CONTINUE_ANYWAY = en.t(SETUP_LANGUAGE.continueAnyway);
const DEVICE_PILL = en.t(SETUP_LANGUAGE.devicePill);
const MARATHI = LANGUAGE_META.mr.endonym;

test.describe('at 375', () => {
  const HEIGHT = 812;
  test.use({ viewport: { width: 375, height: HEIGHT } });

  test('the languages are one column of equal cards, and the way on stays on screen', async ({
    mount,
    page,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed={false} />);
    const cards = step.getByRole('radio');
    await expect(cards).toHaveCount(3);
    const boxes = await Promise.all([0, 1, 2].map((index) => cards.nth(index).boundingBox()));

    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'left');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'right');
    expect(boxes[1]?.y).toBeGreaterThan((boxes[0]?.y ?? 0) + (boxes[0]?.height ?? 0));
    expect(boxes[2]?.y).toBeGreaterThan((boxes[1]?.y ?? 0) + (boxes[1]?.height ?? 0));

    const way = await step.getByRole('button', { name: CONTINUE }).boundingBox();
    expect((way?.y ?? Infinity) + (way?.height ?? 0)).toBeLessThanOrEqual(HEIGHT);
    expect(way?.width).toBe(boxes[0]?.width);
    await expectNoSidewaysScroll(page);
  });

  test('every control is at least the touch floor on both axes', async ({ mount }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device={null} failed />);
    const controls = [
      step.getByRole('button', { name: ASK }),
      step.getByRole('radio').nth(0),
      step.getByRole('radio').nth(1),
      step.getByRole('radio').nth(2),
      step.getByRole('button', { name: TRY_AGAIN }),
      step.getByRole('button', { name: CONTINUE_ANYWAY }),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
  });

  test('a tap on a card reports its language, and the device’s pill stays where it was', async ({
    mount,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed={false} />);
    const english = step.getByRole('radio').nth(0);
    const marathi = step.getByRole('radio', { name: MARATHI });
    await expect(english).toBeChecked();

    await marathi.click();
    await expect(step.getByTestId('chosen')).toHaveText('mr');
    await expect(marathi).toBeChecked();
    await expect(english).toContainText(DEVICE_PILL);
    await expect(marathi.locator(`[lang="${LANGUAGE_META.mr.tag}"]`)).toHaveText(MARATHI);
  });

  test('a failed save is an alert over the languages, with two ways on, one under the other', async ({
    mount,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed />);
    const alert = step.getByRole('alert');
    await expect(alert).toContainText(en.t(SETUP_LANGUAGE.notSavedTitle));
    await expect(alert).toContainText(en.t(SETUP_LANGUAGE.notSavedBody));
    const alertBox = await alert.boundingBox();
    const first = await step.getByRole('radio').nth(0).boundingBox();
    expect((alertBox?.y ?? 0) + (alertBox?.height ?? 0)).toBeLessThan(first?.y ?? 0);

    const again = step.getByRole('button', { name: TRY_AGAIN });
    const anyway = step.getByRole('button', { name: CONTINUE_ANYWAY });
    await expect(step.getByRole('button', { name: CONTINUE, exact: true })).toHaveCount(0);
    await expectSharedEdge([again, anyway], 'left');
    await expectSharedEdge([again, anyway], 'right');
    const againBox = await again.boundingBox();
    const anywayBox = await anyway.boundingBox();
    expect(anywayBox?.y).toBeGreaterThan((againBox?.y ?? 0) + (againBox?.height ?? 0));

    await again.click();
    await expect(step.getByTestId('pressed')).toHaveText('continue');
    await anyway.click();
    await expect(step.getByTestId('pressed')).toHaveText('anyway');
  });

  test('while the step is being recorded the primary is busy and the other way on is off', async ({
    mount,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed saving />);
    await expect(step.getByRole('button', { name: TRY_AGAIN })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    const anyway = step.getByRole('button', { name: CONTINUE_ANYWAY });
    await expect(anyway).toBeDisabled();
    await anyway.click({ force: true });
    await expect(step.getByTestId('pressed')).toHaveText('');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} a failed save keeps both ways on on screen, and nothing scrolls sideways`, async ({
      mount,
      page,
    }) => {
      const words = await createTranslator(reader);
      const step = await mount(<LanguageStepAsHeld reader={reader} device={reader} failed />);
      await expect(step.getByRole('alert')).toContainText(words.t(SETUP_LANGUAGE.notSavedBody));
      const anyway = await step
        .getByRole('button', { name: words.t(SETUP_LANGUAGE.continueAnyway) })
        .boundingBox();
      const lastCard = await step.getByRole('radio').nth(2).boundingBox();
      const again = await step
        .getByRole('button', { name: words.t(SIGN_IN.tryAgain) })
        .boundingBox();
      expect((anyway?.y ?? Infinity) + (anyway?.height ?? 0)).toBeLessThanOrEqual(HEIGHT);
      expect((lastCard?.y ?? Infinity) + (lastCard?.height ?? 0)).toBeLessThanOrEqual(
        again?.y ?? 0,
      );
      await expectNoSidewaysScroll(page);
    });
  }

  test('a device outside the set is a status in one line, and its pill sits on English', async ({
    mount,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device={null} failed={false} />);
    await expect(step.getByRole('status')).toHaveText(en.t(SETUP_LANGUAGE.notInSet));
    await expect(step.getByRole('alert')).toHaveCount(0);
    await expect(step.getByRole('radio').nth(0)).toContainText(en.t(SETUP_LANGUAGE.chosenPill));
  });
});

test.describe('at 800, under the breakpoint with the column at its whole measure', () => {
  test.use({ viewport: { width: 800, height: 900 } });

  test('the languages stay one column over the full-width way on', async ({ mount, page }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed={false} />);
    const cards = step.getByRole('radio');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'left');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'right');
    await expectNoSidewaysScroll(page);
  });
});

test.describe('at 968, where the task column is at its narrowest', () => {
  test.use({ viewport: { width: 968, height: 900 } });

  test('the languages stay one column, so the pill stays inside its card', async ({
    mount,
    page,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed={false} />);
    const cards = step.getByRole('radio');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'left');
    const card = await cards.nth(0).boundingBox();
    const pill = await cards.nth(0).getByText(DEVICE_PILL).boundingBox();
    expect((pill?.x ?? Infinity) + (pill?.width ?? 0)).toBeLessThanOrEqual(
      (card?.x ?? 0) + (card?.width ?? 0),
    );
    await expectNoSidewaysScroll(page);
  });
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('the set is one row of three cards of one height, beside the question', async ({
    mount,
    page,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed={false} />);
    const cards = step.getByRole('radio');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'top');
    await expectSharedEdge([cards.nth(0), cards.nth(1), cards.nth(2)], 'bottom');
    const boxes = await Promise.all([0, 1, 2].map((index) => cards.nth(index).boundingBox()));
    expect(boxes[1]?.width).toBe(boxes[0]?.width);
    expect(boxes[2]?.width).toBe(boxes[0]?.width);
    expect(boxes[1]?.x).toBeGreaterThan((boxes[0]?.x ?? 0) + (boxes[0]?.width ?? 0));
    const pill = await cards.nth(0).getByText(DEVICE_PILL).boundingBox();
    expect((pill?.x ?? Infinity) + (pill?.width ?? 0)).toBeLessThanOrEqual(
      (boxes[0]?.x ?? 0) + (boxes[0]?.width ?? 0),
    );

    const heading = await step
      .getByRole('heading', { name: en.t(SETUP_LANGUAGE.title) })
      .boundingBox();
    expect((heading?.x ?? Infinity) + (heading?.width ?? 0)).toBeLessThan(boxes[0]?.x ?? 0);
    await expectNoSidewaysScroll(page);
  });

  test('the ways on stand side by side at their own width, under the languages', async ({
    mount,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device="en" failed />);
    const again = step.getByRole('button', { name: TRY_AGAIN });
    const anyway = step.getByRole('button', { name: CONTINUE_ANYWAY });
    await expectSharedEdge([again, anyway], 'top');
    const againBox = await again.boundingBox();
    const anywayBox = await anyway.boundingBox();
    const card = await step.getByRole('radio').nth(0).boundingBox();
    expect(anywayBox?.x).toBeGreaterThan((againBox?.x ?? 0) + (againBox?.width ?? 0));
    expect(againBox?.x).toBe(card?.x);
    expect(againBox?.y).toBeGreaterThan((card?.y ?? 0) + (card?.height ?? 0));
    expect(againBox?.width).toBeLessThan(card?.width ?? 0);
  });

  test('the finding about the person sits in the identity half, left of the languages', async ({
    mount,
  }) => {
    const step = await mount(<LanguageStepAsHeld reader="en" device={null} failed />);
    const card = await step.getByRole('radio').nth(0).boundingBox();
    for (const finding of [step.getByRole('alert'), step.getByRole('status')]) {
      const box = await finding.boundingBox();
      expect((box?.x ?? Infinity) + (box?.width ?? 0)).toBeLessThan(card?.x ?? 0);
    }
  });
});
