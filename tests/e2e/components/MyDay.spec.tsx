import { createTranslator, myDayWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { settledBox } from '../support/layout';
import { ASHA, itemOf, KIRAN, MEERA, NEXT } from '../support/my-day';
import { expectTouchFloor } from '../support/touch-target';
import { MyDayStory } from './MyDay.story';

const en = await createTranslator('en');
const words = myDayWords(en.t);
const name = (seed: { readonly name: string | null }) => seed.name ?? words.unnamed;

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the next task leads, late in red, with its bill, its why and its acts', async ({
    mount,
    page,
  }) => {
    const calls: string[] = [];
    const day = await mount(<MyDayStory state="day" onCall={(id) => calls.push(id)} />);
    const hero = day.getByRole('region', { name: words.nextUp });

    await expect(hero.getByRole('heading', { name: name(NEXT) })).toBeVisible();
    await expect(hero.getByText(words.daysLate(2))).toBeVisible();
    await expect(hero.getByText(words.position(1, 17))).toBeVisible();
    await expect(hero.getByText(/4,200/)).toBeVisible();
    await expect(hero.getByText(words.why(itemOf(NEXT)) ?? '')).toBeVisible();
    await hero.getByRole('button', { name: words.call }).click();
    await expect.poll(() => calls.length).toBe(1);
    await expect(hero.getByRole('button', { name: words.doneName(name(NEXT)) })).toBeVisible();
    const move = hero.getByRole('button', { name: words.moveToTomorrow });
    await expect(move).toBeVisible();
    await expect(hero.getByText(words.whyFirstLate)).toBeVisible();
    // One footer row, as the sample draws it: why-first beside Move to tomorrow, whose words end
    // where the Done circle ends — the hero's content edge.
    const why = await settledBox(hero.getByText(words.whyFirstLate));
    const moveBox = await settledBox(move);
    expect(
      Math.abs(
        (why?.y ?? 0) + (why?.height ?? 0) / 2 - ((moveBox?.y ?? 0) + (moveBox?.height ?? 0) / 2),
      ),
    ).toBeLessThanOrEqual(4);
    const doneBox = await settledBox(
      hero.getByRole('button', { name: words.doneName(name(NEXT)) }),
    );
    // The words' own right edge, not the button's: the small pill's padding sits past the edge.
    const wordsRight = await move.evaluate((button) => {
      const range = document.createRange();
      range.selectNodeContents(button);
      return Math.max(...[...range.getClientRects()].map((rect) => rect.right));
    });
    expect(Math.abs(wordsRight - ((doneBox?.x ?? 0) + (doneBox?.width ?? 0)))).toBeLessThanOrEqual(
      2,
    );

    await expectTouchFloor(await day.getByRole('button').all());
    await expectNoSeriousViolations(page);
  });

  test('a hero no one may dial says so on its face, beside the dimmed Call', async ({ mount }) => {
    const day = await mount(<MyDayStory state="day" nextSeed={KIRAN} />);
    const hero = day.getByRole('region', { name: words.nextUp });
    await expect(hero.getByRole('button', { name: words.call })).toBeDisabled();
    await expect(hero.getByText(words.callOff)).toBeVisible();
    await expect(hero.getByText(words.whyFirstLate)).toHaveCount(0);
  });

  test('the bands: overdue first with its count and more, a visit offers directions, a do-not-call row says why', async ({
    mount,
  }) => {
    const expanded: string[] = [];
    const directions: string[] = [];
    const day = await mount(
      <MyDayStory
        state="day"
        onExpand={(band) => expanded.push(band)}
        onDirections={(id) => directions.push(id)}
      />,
    );
    const overdue = day.getByRole('region', { name: words.band('overdue') });
    const today = day.getByRole('region', { name: words.band('today') });

    await expect(overdue.getByText('14')).toBeVisible();
    await expect(overdue.getByText(name(ASHA))).toBeVisible();
    await expect(overdue.getByText(words.daysLate(6))).toBeVisible();
    await expect(overdue.getByText(words.unnamed).first()).toBeVisible();
    const callOff = overdue.getByRole('button', { name: words.callName(name(KIRAN)) });
    await expect(callOff).toBeDisabled();
    // The reason is in the row itself, not behind the circle; only the off row says it.
    await expect(overdue.getByText(words.callOff)).toHaveCount(1);
    await expect(overdue.getByRole('listitem').filter({ hasText: name(KIRAN) })).toContainText(
      words.callOff,
    );
    // No face on a row: the name and the task line take the room the face held at 375.
    await expect(overdue.locator('.hg-avatar')).toHaveCount(0);
    const wordsBox = await settledBox(overdue.locator('.hg-my-day-row-words').first());
    expect(wordsBox?.width ?? 0).toBeGreaterThan(160);
    await overdue.getByRole('button', { name: words.showMore(11) }).click();
    await expect.poll(() => expanded).toEqual(['overdue']);

    await expect(today.getByText(name(MEERA))).toBeVisible();
    await today.getByRole('button', { name: words.directions }).click();
    await expect.poll(() => directions.length).toBe(1);
    const todayBox = await settledBox(today);
    const overdueBox = await settledBox(overdue);
    expect(todayBox?.y).toBeGreaterThan((overdueBox?.y ?? 0) + (overdueBox?.height ?? 0) - 1);
  });

  test('a tick marks the task done at once, and the row opens the lead', async ({
    mount,
    page,
  }) => {
    const done: string[] = [];
    const opened: string[] = [];
    const day = await mount(
      <MyDayStory state="day" onDone={(id) => done.push(id)} onOpen={(id) => opened.push(id)} />,
    );
    const tick = day.getByRole('checkbox', { name: words.doneName(name(ASHA)) });

    await tick.check();
    await expect(tick).toBeChecked();
    await expect.poll(() => done.length).toBe(1);

    await day.getByRole('button', { name: words.open(name(ASHA)) }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => opened).toEqual(done);
  });

  test('after a call the hero asks how it went, and is inert while the answer is out', async ({
    mount,
  }) => {
    const answers: string[] = [];
    const day = await mount(<MyDayStory state="asking" onAnswer={(o) => answers.push(o)} />);

    await expect(day.getByText(words.howDidItGo(name(NEXT)))).toBeVisible();
    await day.getByRole('button', { name: words.answered }).click();
    await expect.poll(() => answers).toEqual(['answered']);
    const notNow = day.getByRole('button', { name: words.notNow });
    await expect(notNow).toBeVisible();
    // A pill, never bare words: its edge is drawn.
    expect(await notNow.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe('none');

    await day.update(<MyDayStory state="asking" sending />);
    await expect(day.getByRole('button', { name: words.noAnswer })).toBeDisabled();
    await expect(day.getByRole('checkbox', { name: words.doneName(name(ASHA)) })).toBeDisabled();
  });

  test('an act that did not land says so by the hero', async ({ mount }) => {
    const day = await mount(<MyDayStory state="day" failed />);
    await expect(day.getByRole('alert')).toHaveText(words.actFailed);
  });

  test('a clear day says so', async ({ mount, page }) => {
    const day = await mount(<MyDayStory state="clear" />);
    await expect(day.getByText(words.emptyTitle)).toBeVisible();
    await expect(day.getByText(words.emptyBody)).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('a read that failed offers its retry', async ({ mount }) => {
    let retries = 0;
    const day = await mount(<MyDayStory state="failed" onRetry={() => (retries += 1)} />);
    await expect(day.getByText(words.failedTitle)).toBeVisible();
    await day.getByRole('button', { name: words.retry }).click();
    await expect.poll(() => retries).toBe(1);
  });

  test('a read still out draws its loading', async ({ mount, page }) => {
    await mount(<MyDayStory state="loading" />);
    await expect(page.getByRole('status', { name: words.loading })).toBeVisible();
  });
});

test.describe('at 1280', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('the hero and overdue sit left, today and this week right', async ({ mount, page }) => {
    const day = await mount(<MyDayStory state="day" />);
    const hero = await settledBox(day.getByRole('region', { name: words.nextUp }));
    const overdue = await settledBox(day.getByRole('region', { name: words.band('overdue') }));
    const today = await settledBox(day.getByRole('region', { name: words.band('today') }));
    const week = await settledBox(day.getByRole('region', { name: words.band('week') }));

    expect(overdue?.x).toBe(hero?.x);
    expect(overdue?.y).toBeGreaterThan(hero?.y ?? 0);
    expect(today?.x).toBeGreaterThan((hero?.x ?? 0) + (hero?.width ?? 0));
    expect(today?.y).toBe(hero?.y);
    expect(week?.y).toBeGreaterThan(today?.y ?? 0);
    await expectNoSeriousViolations(page);
  });
});

test('a tick the server refused is undone, so the row can be ticked again', async ({ mount }) => {
  const day = await mount(<MyDayStory state="day" />);
  const overdue = day.getByRole('region', { name: words.band('overdue') });
  const tick = overdue.getByRole('checkbox', { name: words.doneName(name(ASHA)) });

  await tick.check();
  await expect(tick).toBeChecked();
  await day.update(<MyDayStory state="day" failed />);
  await expect(tick).not.toBeChecked();
  await expect(tick).toBeEnabled();
  // Another act starts and clears the failure: the refused row stays unticked.
  await day.update(<MyDayStory state="day" />);
  await expect(tick).not.toBeChecked();
});

test("each row's menu moves its task to tomorrow (gap 12)", async ({ mount, page }) => {
  const moved: string[] = [];
  const day = await mount(<MyDayStory state="day" onMove={(taskId) => moved.push(taskId)} />);
  const overdue = day.getByRole('region', { name: words.band('overdue') });

  await overdue.getByRole('button', { name: words.rowMenu(name(ASHA)) }).click();
  // A real click, no force: the open menu must stand above the next row's open target.
  await page.getByRole('menuitem', { name: words.moveToTomorrow }).click();

  await expect.poll(() => moved).toEqual([itemOf(ASHA).task.id]);
});
