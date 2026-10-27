import { createTranslator, paymentTermsWords, stageWords } from '@heliogrid/i18n';
import { Timeline } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { type PickStage, StagePicker } from './Timeline.story';

/**
 * Design-system change 17 (`SCR-M01-20`'s stage picker): with `onChange` the timeline is a radio
 * group over its steps, named by `label`, one step in the tab order, the arrow keys moving AND
 * choosing; a stage a project may skip takes the warning node. Without `onChange` it is the
 * sequence it always was, and draws no radio.
 */

const en = await createTranslator('en');
const words = paymentTermsWords(en.t);
const stages = stageWords(en.t);
const advance = words.newTranche(1);
const label = words.whenDue(advance);

const CHAIN: PickStage[] = [
  {
    id: 'won',
    label: stages.won.short,
    description: stages.won.when,
    due: [words.trancheShare(advance, '20')],
  },
  {
    id: 'dispatched',
    label: stages.dispatched.short,
    description: stages.dispatched.when,
    skippable: words.canBeSkipped,
  },
  { id: 'commissioned', label: stages.commissioned.short, description: stages.commissioned.when },
];

test('a pick by click: the step calls onChange with its id and reads checked in the named group', async ({
  mount,
}) => {
  const frame = await mount(<StagePicker label={label} stages={CHAIN} />);
  const group = frame.getByRole('radiogroup', { name: label });
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(CHAIN.length);
  await expect(group.locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);

  await group.getByRole('radio', { name: stages.dispatched.short }).click();

  await expect(frame).toHaveAttribute('data-picks', 'dispatched');
  await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false');
});

test('arrow keys move the pick with one stop, and Tab leaves the group', async ({
  mount,
  page,
}) => {
  const frame = await mount(<StagePicker label={label} stages={CHAIN} />);
  const group = frame.getByRole('radiogroup', { name: label });
  const radios = group.getByRole('radio');
  const stops = group.locator('[role="radio"][tabindex="0"]');

  /* None chosen: the first step is the one stop. */
  await expect(stops).toHaveCount(1);
  await expect(radios.nth(0)).toHaveAttribute('tabindex', '0');

  await radios.nth(0).focus();
  await page.keyboard.press('ArrowDown');

  await expect(radios.nth(1)).toBeFocused();
  await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(frame).toHaveAttribute('data-picks', 'dispatched');
  await expect(stops).toHaveCount(1);
  await expect(radios.nth(1)).toHaveAttribute('tabindex', '0');

  /* Back up past the first step wraps to the last. */
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(radios.nth(2)).toBeFocused();
  await expect(frame).toHaveAttribute('data-picks', 'dispatched,won,commissioned');

  await page.keyboard.press('Tab');
  await expect(group.locator(':focus')).toHaveCount(0);
  await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
});

test('a stage a project may skip takes the warning node, and the chosen node the accent', async ({
  mount,
  page,
}) => {
  const frame = await mount(<StagePicker label={label} stages={CHAIN} initial="won" />);
  const nodes = frame.locator('.hg-timeline-pick-node');

  await expect(nodes.nth(1)).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--warning-bg'),
  );
  await expect(nodes.nth(1)).toHaveCSS('color', await resolvedColour(page, '--warning-text'));
  await expect(nodes.nth(0)).toHaveCSS('background-color', await resolvedColour(page, '--accent'));
  await expect(nodes.nth(0)).toHaveCSS('color', await resolvedColour(page, '--text-inverse'));
  await expect(nodes.nth(2)).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--canvas-sunken'),
  );
  await expect(frame.getByRole('radio', { name: stages.dispatched.short })).toContainText(
    words.canBeSkipped,
  );
});

test('a timeline without onChange is the sequence it was, and draws no radio', async ({
  mount,
}) => {
  const timeline = await mount(
    <Timeline
      items={CHAIN.map((stage) => ({
        id: stage.id,
        label: stage.label,
        status: 'upcoming' as const,
      }))}
    />,
  );

  await expect(timeline.getByRole('radio')).toHaveCount(0);
  await expect(timeline.getByRole('radiogroup')).toHaveCount(0);
  await expect(timeline.getByRole('listitem')).toHaveCount(CHAIN.length);
});
