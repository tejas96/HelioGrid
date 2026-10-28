import { DEFAULT_TIMELINE_PHASES, type UiLanguage } from '@heliogrid/domain';
import { createTranslator, languageName, proposalTemplateWords } from '@heliogrid/i18n';
import { expect } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { expectNoSidewaysScroll, settledBox } from './layout';
import { resolvedColour, resolvedLength, resolvedShadow } from './token';
import { expectTouchFloor } from './touch-target';

/**
 * The Proposal template spec's shared reads (`SCR-M01-19`): the words in each language and the
 * measures every frame is read against (the locked board's code, `.design/M01/`).
 */
export { COMPANY } from './proposal-template-sample';

/* The board's window heights (`pfStage`, `pfStageShort`), its sheet and its card (`Editor 1536`). */
export const STAGE_WINDOW = { tall: 186, short: 120 };
export const SHEET_WIDTH = 480;
export const EDITOR_CARD_WIDTH = 420;

export const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

export function wordsIn(reader: UiLanguage) {
  return proposalTemplateWords(READERS[reader].t);
}

export const en = wordsIn('en');

/** The tenant's six phases (m19-e): the platform's first six, in the reader's language. */
export function phaseTitles(reader: UiLanguage, count: number): string[] {
  return DEFAULT_TIMELINE_PHASES.slice(0, count).map(
    (phase) => phase.name[reader] ?? phase.name.en,
  );
}

export const englishName = languageName('en');

export const WIDTHS = [
  { name: '375', viewport: { width: 375, height: 812 }, wide: false },
  { name: '1536', viewport: { width: 1536, height: 1132 }, wide: true },
] as const;

export const stage = (body: Locator) => body.locator('.hg-template-stage');
export const frameWindow = (body: Locator) => body.locator('.hg-preview-frame-window');
export const partSwitch = (body: Locator) => body.getByRole('radiogroup', { name: en.edit });
export const pageEnd = (body: Locator) => body.locator('.hg-template-end');
export const actBar = (body: Locator) => body.locator('.hg-form-action-bar');
export const card = (body: Locator) => body.getByRole('region', { name: en.editor });

export async function heightOf(locator: Locator): Promise<number> {
  return (await settledBox(locator))?.height ?? 0;
}

/**
 * Every frame's shared blocks: the stage on its desk with its caption row, the part switch, the
 * two rows out, 44 px targets, and at width the 420 card `sp-8` from the stage and level with it.
 */
export async function expectStageAndEditor(page: Page, body: Locator, wide: boolean) {
  const desk = stage(body);
  await expect(desk).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(desk).toHaveCSS(
    'border-top-left-radius',
    `${await resolvedLength(page, wide ? '--r-xl' : '--r-lg')}px`,
  );
  await expect(desk.getByText(en.stageCaption)).toBeVisible();
  const openFullSize = body.getByRole('button', { name: en.openFullSize });
  await expect(openFullSize).toBeVisible();
  await expect(partSwitch(body)).toBeVisible();
  const branding = body.getByRole('button', { name: en.brandingRow });
  const bank = body.getByRole('button', { name: en.bankRow });
  await expect(branding).toContainText(en.brandingFrom);
  await expect(bank).toBeVisible();
  await expectTouchFloor([branding, bank, ...(wide ? [] : [openFullSize])]);
  if (wide) {
    await expect(body.getByRole('region', { name: en.stage })).toBeVisible();
    const editor = card(body);
    await expect(editor).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
    await expect(editor).toHaveCSS(
      'border-top-left-radius',
      `${await resolvedLength(page, '--r-tile')}px`,
    );
    const deskBox = await settledBox(desk);
    const cardBox = await settledBox(editor);
    expect(cardBox?.width).toBe(EDITOR_CARD_WIDTH);
    expect((cardBox?.x ?? 0) - ((deskBox?.x ?? 0) + (deskBox?.width ?? 0))).toBe(
      await resolvedLength(page, '--sp-8'),
    );
    expect(cardBox?.y).toBe(deskBox?.y);
    expect((await settledBox(frameWindow(body)))?.width).toBe(SHEET_WIDTH);
  } else {
    /* At 375 the window leads and the editor follows the stage. */
    const deskBox = await settledBox(desk);
    const switchBox = await settledBox(partSwitch(body));
    expect(switchBox?.y ?? 0).toBeGreaterThan((deskBox?.y ?? Infinity) + (deskBox?.height ?? 0));
  }
  await expectNoSidewaysScroll(page);
}

/**
 * No box of the page reaches past the box that holds it — a word that clipped or pushed out. The
 * preview's subject is left out: it is drawn at the sheet's 480 and scaled into its window on purpose.
 */
export async function expectNothingWiderThanItsRoom(page: Page) {
  const outside = await page.evaluate(() =>
    [...document.querySelectorAll('.hg-template *')]
      .filter(
        (node) => node.closest('.hg-preview-frame-subject, .hg-preview-frame-window') === null,
      )
      /* Words for the screen reader alone are clipped to nothing on purpose. */
      .filter((node) => !node.classList.contains('hg-spoken-only'))
      /* `ValueSource`'s act reaches its 44 px into the gutter around it, as it is drawn; the page
         itself never scrolls sideways (`expectNoSidewaysScroll`). */
      .filter((node) => !node.classList.contains('hg-value-source-action'))
      .filter((node) => {
        const room = node.parentElement?.closest(
          '.hg-template-card, .hg-template-stage, .hg-template-editor, .hg-template',
        );
        if (room === null || room === undefined) return false;
        const box = node.getBoundingClientRect();
        const edges = room.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) return false;
        /* A field's own text scrolls inside it by design; any other box that scrolls clips a word. */
        const scrolls =
          !(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) &&
          !(node instanceof HTMLElement && node.isContentEditable) &&
          node.scrollWidth > node.clientWidth + 1 &&
          getComputedStyle(node).overflowX !== 'visible';
        return box.right > edges.right + 1 || box.left < edges.left - 1 || scrolls;
      })
      .map((node) => node.getAttribute('class') ?? node.tagName),
  );
  expect(outside).toEqual([]);
}

/** The 375 window: 186 while Cover or Sections is open, 120 while Terms or Timeline is. */
export function windowHeightFor(part: 'cover' | 'sections' | 'terms' | 'timeline'): number {
  return part === 'cover' || part === 'sections' ? STAGE_WINDOW.tall : STAGE_WINDOW.short;
}
