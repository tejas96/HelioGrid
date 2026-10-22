import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { resolvedLength } from '../support/token';
import { FactRowAsHeld, FactRowsAsHeld, type HeldRow } from './FactRow.story';

/* `FactRow` / `FactRows` (`AC-9`): a pair while every value fits on one line in its own column,
   measured on the room's own box; one line that wraps (`lead`) once a value would not. The rows are
   DATA — a date, a state, a place — handed in as a screen hands them, in each reader's script. */

/** 34 characters — past `longAt` — that still fit on one line beside a short word. */
const CITY: HeldRow = { label: 'City', value: 'Kharghar, Navi Mumbai, Maharashtra' };
const ADDRESS = 'Plot 14, Sector 21, Kharghar, Navi Mumbai 410210';
const DATE: HeldRow = { label: 'Survey date', value: '14 Mar 2026' };

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (found === null) throw new Error('not laid out');
  return found;
}

/** Waits until the room has reported `count` answers, and returns them. */
async function reported(root: Locator, count: number): Promise<Record<string, unknown>[]> {
  const forms = async () => JSON.parse((await root.getByTestId('forms').textContent()) ?? '[]');
  await expect.poll(async () => (await forms()).length).toBe(count);
  return forms();
}

/** The first answer a room reported. */
async function answer(root: Locator) {
  return (await reported(root, 1))[0];
}

/** Resizes the room and waits two frames, so the observer has measured the new width. */
async function roomTo(root: Locator, width: number) {
  await root.getByTestId('room').evaluate(
    (room, next) =>
      new Promise<void>((done) => {
        room.style.width = `${next}px`;
        requestAnimationFrame(() => requestAnimationFrame(() => done()));
      }),
    width,
  );
}

/** 343 → 200 (under the 240 floor) → 220 (still under: no new answer) → 343, every answer kept. */
async function narrowAndBack(root: Locator) {
  await reported(root, 1);
  await roomTo(root, 200);
  await reported(root, 2);
  await roomTo(root, 220);
  await roomTo(root, 343);
  return reported(root, 3);
}

const group = (root: Locator) => root.locator('dl.hg-fact-rows');
const rows = (root: Locator) => root.locator('.hg-fact-row');
const boxes = (locator: Locator, count: number) =>
  Promise.all(Array.from({ length: count }, (_, i) => box(locator.nth(i))));

for (const [width, height] of [
  [375, 812],
  [1536, 1000],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    for (const reader of ['en', 'hi', 'mr'] as const) {
      test(`in ${reader}, short values keep the pair`, async ({ mount, page }) => {
        const root = await mount(<FactRowsAsHeld reader={reader} sample="short" />);
        expect(await answer(root)).toMatchObject({ form: 'pair', reason: 'fits' });
        const terms = await boxes(root.getByRole('term'), 3);
        const values = await boxes(root.getByRole('definition'), 3);
        for (const [i, value] of values.entries()) {
          const term = terms[i] ?? value;
          expect(value.x).toBeGreaterThanOrEqual(term.x + term.width);
          expect(Math.abs(value.y - term.y)).toBeLessThan(term.height / 2);
          expect(value.x).toBeCloseTo(values[0]?.x ?? 0, 0);
          expect(term.x).toBeCloseTo(terms[0]?.x ?? 0, 0);
        }
        const sideways = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(sideways).toBe(0);
      });

      test(`in ${reader}, a value that would wrap takes the group to lead`, async ({ mount }) => {
        const root = await mount(<FactRowsAsHeld reader={reader} sample="wraps" />);
        expect(await answer(root)).toMatchObject({ form: 'lead', reason: 'measured' });
        await expect(rows(root).nth(0)).toHaveAttribute('data-fact-form', 'flow');
        const row = rows(root).nth(1);
        await expect(row).toHaveAttribute('data-fact-form', 'flow');
        const [first, last] = await row.getByRole('definition').evaluate((dd) => {
          const lines = [...dd.getClientRects()];
          return [lines[0], lines.at(-1)].map((line) => ({ x: line?.x ?? 0, y: line?.y ?? 0 }));
        });
        const word = await box(row.getByRole('term'));
        expect(Math.abs((first?.y ?? 0) - word.y)).toBeLessThan(word.height);
        /* Full width, the line holds at 1536; at 375 it wraps, and continues under the word. */
        if (width === 1536) expect(last?.y).toBe(first?.y);
        else {
          expect(last?.y).toBeGreaterThan(word.y);
          expect(last?.x).toBeCloseTo(word.x, 0);
        }
      });
    }

    test('long and form force a form; long false keeps a pair', async ({ mount }) => {
      for (const [held, form, expected, last] of [
        [[CITY], undefined, { form: 'lead', reason: 'declared' }, 'flow'],
        [[{ ...CITY, long: false }], undefined, { form: 'pair', reason: 'fits' }, 'pair'],
        [[{ ...CITY, value: 'Pune', long: true }], undefined, { reason: 'declared' }, 'flow'],
        [[DATE, CITY], 'pair', { form: 'pair', reason: 'forced' }, 'pair'],
        [[DATE, { ...CITY, value: 'Pune' }], 'lead', { form: 'lead', reason: 'forced' }, 'flow'],
        /* A row's own form, inside a group that pairs. */
        [[DATE, { ...CITY, value: 'Pune', form: 'lead' }], undefined, { form: 'pair' }, 'flow'],
      ] as const) {
        const root = await mount(<FactRowsAsHeld rows={[...held]} form={form} />);
        expect(await answer(root)).toMatchObject(expected);
        await expect(rows(root).last()).toHaveAttribute('data-fact-form', last);
        await root.unmount();
      }
    });

    test('short items join with a dot; long ones stack; stack overrides', async ({ mount }) => {
      for (const [values, stack, expected, joins] of [
        [['Voice calls', 'AI detections'], undefined, 'pair', 1],
        [[ADDRESS, 'Survey photos'], undefined, 'stack', 0],
        [[ADDRESS, 'Survey photos'], false, 'flow', 1],
        [['Net', 'Solar'], true, 'stack', 0],
      ] as const) {
        const site = { label: 'Site', values: [...values], stack };
        const root = await mount(<FactRowsAsHeld rows={[site]} />);
        await reported(root, 1);
        await expect(rows(root)).toHaveAttribute('data-fact-form', expected);
        await expect(root.locator('.hg-fact-join')).toHaveCount(joins);
        if (expected === 'stack') {
          const [one, two] = await boxes(root.locator('.hg-fact-stack > *'), 2);
          expect(two?.y).toBeGreaterThanOrEqual((one?.y ?? 0) + (one?.height ?? 0));
          expect(two?.x).toBeCloseTo(one?.x ?? 0, 0);
        }
        await root.unmount();
      }
    });

    test('longAt: a string at it is measured, one past it is long', async ({ mount }) => {
      for (const [length, longAt, reason] of [
        [32, undefined, 'fits'],
        [33, undefined, 'declared'],
        [10, 10, 'fits'],
        [11, 10, 'declared'],
      ] as const) {
        const code = { label: 'Code', value: 'x'.repeat(length) };
        const root = await mount(<FactRowsAsHeld rows={[code]} longAt={longAt} />);
        expect(await answer(root)).toMatchObject({ reason });
        await root.unmount();
      }
      const list = { label: 'Codes', values: ['x'.repeat(11), 'y'] };
      const auto = await mount(<FactRowsAsHeld rows={[list]} longAt={10} />);
      await reported(auto, 1);
      await expect(rows(auto)).toHaveAttribute('data-fact-form', 'stack');
    });

    test('one mark reserves the column, so the words keep one edge', async ({ mount }) => {
      const marked = [DATE, { ...CITY, mark: true }];
      for (const form of ['pair', 'lead'] as const) {
        const root = await mount(<FactRowsAsHeld rows={marked} form={form} />);
        await reported(root, 1);
        const [one, two] = await boxes(root.locator('.hg-fact-word'), 2);
        expect(two?.x).toBeCloseTo(one?.x ?? 0, 0);
        expect((await box(root.getByTestId('mark'))).x).toBeLessThan(one?.x ?? 0);
        await root.unmount();
      }
    });

    test('provenance: under the value in pair, at the line end in lead', async ({ mount }) => {
      const yieldRow: HeldRow = { label: 'Yield', value: '7,300 kWh', provenance: 'estimated' };
      const pair = await mount(<FactRowsAsHeld rows={[yieldRow]} />);
      await reported(pair, 1);
      const value = await box(pair.locator('[data-fact-value]'));
      const under = await box(pair.locator('.hg-provenance'));
      expect(under.y).toBeGreaterThanOrEqual(value.y + value.height - 1);
      expect(under.x).toBeCloseTo(value.x, 0);
      await pair.unmount();
      const lead = await mount(<FactRowsAsHeld rows={[{ ...yieldRow, long: true }]} />);
      await reported(lead, 1);
      const flowing = await box(lead.locator('[data-fact-value]'));
      const end = await box(lead.locator('.hg-provenance'));
      expect(end.x).toBeGreaterThan(flowing.x + flowing.width);
      expect(Math.abs(end.y - flowing.y)).toBeLessThan(flowing.height);
    });

    test('a gap replaces the value, drops the tier, names its field', async ({ mount, page }) => {
      const warnings: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'warning') warnings.push(message.text());
      });
      const gap: HeldRow = { ...DATE, value: undefined, gap: 'No survey date yet', fill: 'Add' };
      const root = await mount(<FactRowsAsHeld rows={[{ ...gap, provenance: 'estimated' }]} />);
      await expect(root.locator('[data-fact-value] .hg-named-gap')).toBeVisible();
      await expect(root.locator('.hg-provenance')).toHaveCount(0);
      await expect.poll(() => warnings.some((line) => line.includes(DATE.label))).toBe(true);
      await root.getByRole('button', { name: `Add: ${DATE.label}` }).click();
      await expect(root.getByTestId('filled')).toHaveText(DATE.label);
      await root.unmount();
      const named = await mount(<FactRowsAsHeld rows={[{ ...gap, fieldName: 'Site survey' }]} />);
      await expect(named.getByRole('button', { name: 'Add: Site survey' })).toBeVisible();
    });

    test('measure caps the pair in characters', async ({ mount }) => {
      for (const [measure, reason] of [
        [undefined, 'fits'],
        [12, 'measured'],
      ] as const) {
        const root = await mount(<FactRowsAsHeld sample="short" measure={measure} />);
        expect(await answer(root)).toMatchObject({ reason });
        /* How far the values reach past the room's reading measure: the room's own content edge,
           which the pair's end padding sets at the measure in `ch`. */
        const past = await group(root).evaluate((dl) => {
          const style = getComputedStyle(dl);
          const room = dl.getBoundingClientRect();
          const measured = room.left + room.width - Number.parseFloat(style.paddingInlineEnd);
          const capped = Number.parseFloat(style.paddingInlineEnd) > 0;
          const ends = [...dl.querySelectorAll('dd')].map((dd) => dd.getBoundingClientRect().right);
          return capped ? Math.max(...ends) - measured : 0;
        });
        if (reason === 'fits') expect(past).toBeLessThanOrEqual(1);
        await root.unmount();
      }
    });

    test('leadBelow is a floor; an unmeasured room decides nothing', async ({ mount }) => {
      const probe = await mount(<FactRowsAsHeld sample="short" />);
      const room = (await answer(probe))?.width as number;
      await probe.unmount();
      for (const [leadBelow, reason] of [
        [Math.floor(room) + 1, 'floor'],
        [Math.floor(room) - 1, 'fits'],
      ] as const) {
        const root = await mount(<FactRowsAsHeld sample="short" leadBelow={leadBelow} />);
        expect(await answer(root)).toMatchObject({ reason, width: room });
        await root.unmount();
      }
      const unmeasured = await mount(<FactRowsAsHeld sample="short" width={0} />);
      await expect(group(unmeasured)).not.toHaveAttribute('data-fact-reason', 'floor');
      await reported(unmeasured, 0);
      await roomTo(unmeasured, 343);
      expect(await answer(unmeasured)).toMatchObject({ form: 'pair', reason: 'fits', width: 343 });
    });

    test('onFormChange fires once per changed answer, group and row', async ({ mount }) => {
      const group343 = await mount(<FactRowsAsHeld sample="short" width={343} />);
      expect(await narrowAndBack(group343)).toEqual([
        { form: 'pair', width: 343, hasMark: false, reason: 'fits' },
        { form: 'lead', width: 200, hasMark: false, reason: 'floor' },
        { form: 'pair', width: 343, hasMark: false, reason: 'fits' },
      ]);
      await group343.unmount();
      const row: HeldRow = { label: 'सर्वे की तारीख', value: '14 मार्च 2026', mark: true };
      const alone = await mount(<FactRowAsHeld reader="hi" row={row} width={343} />);
      expect(await narrowAndBack(alone)).toEqual([
        { form: 'pair', shape: 'pair', width: 343, hasMark: true },
        { form: 'lead', shape: 'flow', width: 200, hasMark: true },
        { form: 'pair', shape: 'pair', width: 343, hasMark: true },
      ]);
    });

    test('the list is named by its label, in either density', async ({ mount, page }) => {
      const root = await mount(<FactRowsAsHeld sample="short" label="Site details" />);
      await reported(root, 1);
      await expect(group(root)).toHaveAccessibleName('Site details');
      await expect(root.getByRole('term')).toHaveCount(3);
      await expect(root.getByRole('definition')).toHaveCount(3);
      const small = `${await resolvedLength(page, '--fs-body-sm')}px`;
      await expect(root.getByRole('term').first()).toHaveCSS('font-size', small);
      const [one, two] = await boxes(rows(root), 2);
      const between = (two?.y ?? 0) - ((one?.y ?? 0) + (one?.height ?? 0));
      expect(between).toBeCloseTo(await resolvedLength(page, '--sp-3'), 0);
      await root.unmount();
      const functional = await mount(<FactRowsAsHeld sample="short" density="functional" />);
      await reported(functional, 1);
      await expect(group(functional)).toHaveAttribute('data-density', 'functional');
      await expect(functional.getByRole('definition').first()).toHaveCSS('font-size', small);
    });
  });
}
