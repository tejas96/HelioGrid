import {
  type ImportWizardFrame,
  importContinueGate,
  importWizardStepIndex,
  mappingForHeader,
  type UiLanguage,
} from '@heliogrid/domain';
import { catalogImportWords, createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { framesDrawn } from '../support/catalog-import-frames';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { expectTouchFloor } from '../support/touch-target';
import { CatalogImportAsRead, type ImportBoardFrame } from './CatalogImport.story';

/**
 * The catalog import wizard (`SCR-M01-17`, RFC row P12): every board frame at 375 — the full sheet,
 * or the auto sheet of the two waits — and at 1536 the 960px side panel, each with its title, its
 * step, its act as drawn, no sideways scroll, every control at the touch floor and no serious axe
 * finding; Hindi and Marathi at 375 with nothing clipped and the file's own words untouched; and
 * an opened group at its end state under reduced motion.
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const wordsIn = (reader: UiLanguage) => catalogImportWords(READERS[reader].t);
const en = wordsIn('en');

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

const FRAMES = framesDrawn(en);

/** The gate a frame's act waits on, as the story's job holds it. */
function gateOf(frame: ImportWizardFrame, columns: Parameters<typeof importContinueGate>[1]) {
  const gate = importContinueGate(frame, columns);
  return gate === null ? null : en.gates[gate];
}

/** An outcome's chip: its word beside its drawn mark. */
const chip = (page: Page, label: string) => page.locator('.hg-status-chip', { hasText: label });

/** Every control a person presses inside the wizard, measured against the touch floor. */
const controls = (page: Page) =>
  page
    .locator(
      '.hg-import button:visible, .hg-import input:visible:not([type="file"]), .hg-import-foot button:visible, .hg-detail-panel button:visible',
    )
    .all();

async function expectAct(page: Page, label: string, gate: string | null) {
  const act = page.locator('.hg-import-foot').getByRole('button', { name: label, exact: true });
  await expect(act).toBeVisible();
  if (gate === null) {
    await expect(act).toBeEnabled();
    await expect(act).not.toHaveAttribute('aria-disabled', 'true');
  } else {
    await expect(act).toHaveAttribute('aria-disabled', 'true');
    await expect(act).toHaveAccessibleDescription(gate);
  }
}

/** The frame's own words, beyond its head and act. */
async function expectFrameWords(page: Page, name: ImportBoardFrame, root: Locator) {
  const file = (await root.getAttribute('data-file')) ?? '';
  const text = (words: string) =>
    expect(page.getByText(words, { exact: true }).first()).toBeVisible();
  switch (name) {
    case 'm17-k':
      await text(en.choose);
      await expect(page.getByRole('region', { name: en.keptReports })).toContainText(file);
      return text(en.untouched);
    case 'm17-l':
      await expect(page.getByRole('region', { name: en.keptReports })).toHaveCount(0);
      await text(en.unreadableTitle);
      await text(en.fileProblem);
      return text(en.untouched);
    case 'm17-a':
    case 'm17-f':
      await text(file);
      await text(en.fileMeta(412, 9));
      await expect(page.getByRole('button', { name: en.replace })).toBeVisible();
      await expect(page.getByRole('combobox', { name: en.sheetLabel })).toBeVisible();
      await expect(page.getByRole('list', { name: en.rowOfFile(1) })).toBeVisible();
      if (name === 'm17-f') await text(en.dropAnother);
      return text(en.nextColumns);
    case 'm17-b':
    case 'm17-g':
      await text(en.matchedAutomatically);
      await expect(
        page.getByRole('combobox', { name: en.importColumnAs('Supplier code') }),
      ).toBeVisible();
      return text(en.nextRows);
    case 'm17-i':
      return text(en.matching);
    case 'm17-c':
    case 'm17-d':
    case 'm17-e':
    case 'm17-h':
      await text(en.heading(412));
      await text(name === 'm17-h' ? en.readyLong(405, 7) : en.readyShort(405));
      await text(en.overrideLine);
      await text(en.fixedProgress(0, 7));
      await text('Polycab 6 sq mm DC cable, per metre');
      await text(en.groupTitle(en.groups.overrides, 318));
      await text(en.groupTitle(en.groups.newItems, 87));
      return text(en.undoLine);
    case 'm17-r':
      await text(en.matchLine(3, 412, 'Rayzon'));
      await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
      await text(en.readyToImport);
      await expect(chip(page, en.outcomes.own)).toBeVisible();
      return expect(chip(page, en.outcomes.new)).toBeVisible();
    case 'm17-m':
    case 'm17-p':
      await text(en.heading(412));
      await text(en.fixedProgress(1, 7));
      await text((await root.getAttribute('data-fixed-line')) ?? '');
      await expect(page.getByRole('button', { name: en.undo, exact: true })).toBeVisible();
      await expect(page.locator('[aria-pressed="true"]')).toHaveCount(1);
      return expect(page.getByText(en.groupTitle(en.groups.overrides, 319))).toHaveCount(0);
    case 'm17-n':
      await expect(page.getByRole('progressbar', { name: en.importing })).toBeVisible();
      await text(en.ofRows(405));
      await expect(page.locator('.hg-import-foot .hg-button')).toHaveAttribute(
        'data-variant',
        'secondary',
      );
      return text(en.keepsRunning);
    case 'm17-j':
      await expect(page.getByRole('status', { name: en.opening })).toBeVisible();
      return text((await root.getAttribute('data-stamp')) ?? '');
    case 'm17-o':
    case 'm17-q':
      await text(en.heading(412));
      await text(en.written(317, 86));
      await text(en.groupTitle(en.groups.applied, 317));
      await text(en.countRows(2));
      await text(en.countRows(7));
      return text(en.kept);
  }
}

const PHONE = (Object.keys(FRAMES) as ImportBoardFrame[]).filter((name) => !FRAMES[name].wide);
const PANEL = (Object.keys(FRAMES) as ImportBoardFrame[]).filter((name) => FRAMES[name].wide);
const WIDTHS = [[375, PHONE] as const, [1536, PANEL] as const];

/* One test per frame and width: every frame in one test runs past Playwright's 30 s budget on CI. */
for (const [width, names] of WIDTHS) {
  for (const name of names) {
    test(`frame ${name} at ${width}`, async ({ mount, page }) => {
      await at(page, width);
      const { frame, act } = FRAMES[name];
      const step = importWizardStepIndex(frame);
      const root = await mount(<CatalogImportAsRead reader="en" frame={name} />);
      await expect(page.getByText(en.title, { exact: true }).first(), name).toBeVisible();
      /* The sheet and the panel rise in: measure the box they settle at. */
      await entrySettled(page);
      await expectHead(page, width, step, FRAMES[name].lead);
      const columns = frame === 'columns' ? await guessedColumns(root) : [];
      if (act !== null) await expectAct(page, act, gateOf(frame, columns));
      else await expect(page.locator('.hg-import-foot button'), name).toHaveCount(0);
      await expectFrameWords(page, name, root);
      await pressAsDrawn(page, name, step);
      await expectNoSidewaysScroll(page);
      await expectTouchFloor(await controls(page));
      await expectNoSeriousViolations(page);
    });
  }
}

/** Waits out the surface's entry: every finite animation — the two waits spin while they wait. */
function entrySettled(page: Page) {
  return page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((motion) => motion.effect?.getComputedTiming().iterations !== Infinity)
        .map((motion) => motion.finished),
    ),
  );
}

/**
 * The 375 head names the step in its location line and offers *Back* from step 2 to step 3; the
 * 1536 panel is 960px wide, marks the step in its bars, and leads its foot with *Back* or *Close*.
 */
async function expectHead(page: Page, width: number, step: number, lead: string | null) {
  if (width === 375) {
    const location = page.getByRole('button', { name: en.locationLabel(step) });
    await expect(location).toContainText(en.location(step));
    const back = page.locator('.hg-import-head').getByRole('button', { name: en.back });
    await expect(back).toHaveCount(lead === null ? 0 : 1);
    await expectBarsDrawn(page.locator('.hg-import-head'));
    return;
  }
  const panel = page.getByRole('dialog', { name: en.title });
  expect((await settledBox(panel))?.width).toBe(960);
  const steps = panel.getByRole('navigation', { name: en.stepsLabel });
  await expect(steps.locator('[aria-current="step"]')).toContainText(en.steps[step] ?? '');
  await expectBarsDrawn(steps);
  await expect(page.locator('.hg-import-foot button').first()).toHaveText(lead ?? '');
}

/** Each step's bar is drawn at the board's 4px: a bar of no height draws no location at all. */
async function expectBarsDrawn(within: Locator) {
  const bars = within.locator('.hg-stepper-bar');
  await expect(bars).toHaveCount(4);
  for (const bar of await bars.all()) expect((await settledBox(bar))?.height).toBe(4);
}

/** The board frames that are a press away from their job: a group opened, the step list. */
async function pressAsDrawn(page: Page, name: ImportBoardFrame, step: number) {
  if (name === 'm17-d' || name === 'm17-h') await openOverrides(page);
  if (name !== 'm17-e') return;
  await page.getByRole('button', { name: en.locationLabel(step) }).click();
  const sheet = page.getByRole('dialog', { name: en.whereYouAre });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('list', { name: en.stepsLabel })).toBeVisible();
  await expect(sheet.getByText(en.reportAfterRun)).toBeVisible();
  await entrySettled(page);
}

/** The columns the device guesses from the file's header row — the mapping the story holds. */
async function guessedColumns(root: Locator) {
  const headers = JSON.parse((await root.getAttribute('data-headers')) ?? '[]') as string[];
  const sheet = { name: '', rowCount: 0, columnCount: headers.length, topRows: [headers] };
  return mappingForHeader([sheet], 0, 0).columns;
}

/** *Price overrides*' group line, named by its title and its sample. */
const overridesLine = (page: Page) =>
  page.getByRole('button', { name: new RegExp(en.groupTitle(en.groups.overrides, 318)) });

/** Opens *Price overrides* and waits for its list. */
async function openOverrides(page: Page) {
  const line = overridesLine(page);
  await line.click();
  await expect(line).toHaveAttribute('aria-expanded', 'true');
  await expect(chip(page, en.outcomes.override).first()).toBeVisible();
}

/** The boxes that hold the product's own words at 375, which must never clip in any language. */
const WORDS_BOXES =
  '.hg-button, .hg-text, .hg-select-label, .hg-select-value, .hg-share-filter-ring-label'
    .concat(', .hg-import-head-title, .hg-import-location, .hg-import-section-title')
    .concat(', .hg-import-group-title, .hg-import-reason, .hg-import-foot-line');

test('Hindi and Marathi at 375', async ({ mount, page }) => {
  await at(page, 375);
  for (const reader of ['hi', 'mr'] as const) {
    const words = wordsIn(reader);
    for (const name of ['m17-a', 'm17-c', 'm17-o'] as const) {
      const root = await mount(<CatalogImportAsRead reader={reader} frame={name} />);
      await expect(page.getByText(words.title, { exact: true }).first()).toBeVisible();
      if (name === 'm17-a') {
        /* The file's header cells are its own words: shown exactly as written, never translated. */
        const headers = JSON.parse((await root.getAttribute('data-headers')) ?? '[]') as string[];
        await expect(
          page.getByRole('list', { name: words.rowOfFile(1) }).getByRole('listitem'),
        ).toHaveText(headers);
      } else {
        await expect(page.getByText('Vikram Solar Somera 540 Wp mono PERC').first()).toBeVisible();
      }
      await expectNoSidewaysScroll(page);
      /* Every word the product writes; a file's long item name may end in an ellipsis by design. */
      await expect(page.locator(WORDS_BOXES).first()).toBeVisible();
      await expectNothingClipped(page, WORDS_BOXES);
      await root.unmount();
    }
  }
});

test('reduced motion shows the end state', async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const name of ['m17-d', 'm17-h'] as const) {
    await at(page, FRAMES[name].wide ? 1536 : 375);
    const root = await mount(<CatalogImportAsRead reader="en" frame={name} />);
    const line = overridesLine(page);
    await line.click();
    /* No wait for a transition: the opened list is there on the first read. */
    const opened = page.locator('.hg-import-group-panel');
    expect(await opened.isVisible()).toBe(true);
    await animationsSettled(page);
    await expect(opened.getByText('Adani Solar AS-7-545', { exact: true })).toBeVisible();
    await expect(line).toHaveAttribute('aria-expanded', 'true');
    await root.unmount();
  }
});
