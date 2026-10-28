import {
  COMPANY_LOGO_LIMITS,
  companyLogoRefusal,
  IN_PACK,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  brandingLogoRefusal,
  brandingStandingLine,
  brandingWords,
  createTranslator,
} from '@heliogrid/i18n';
import { expect } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { REFUSED_IMAGE } from './company-logo';
import { expectNoSidewaysScroll, settledBox } from './layout';
import { pngOf } from './png';
import { resolvedColour, resolvedLength, resolvedShadow } from './token';
import { expectTouchFloor } from './touch-target';

/**
 * The Branding page spec's shared reads (`SCR-M01-18`): the board's tenant values, the words in
 * each language, and the measures every frame is read against.
 */
export const COMPANY = 'Suryodaya Solar Pvt Ltd';
export const REFUSED_FILE = 'suryodaya-banner.png';
/* A real image, so the mark draws: the board's 800 × 225 logo at a fifth. */
export const LOGO = `data:image/png;base64,${pngOf(160, 45).toString('base64')}`;
/* The palette colour under the mark floor (s18-n): the stage is cut shorter so its ink stays in view. */
export const UNDER_THE_MARK_FLOOR = '#F2C200';

/* The board's window heights and sheet (`pfStageDoc`, `pfStageDocShort`, `STAGE-1536`). */
export const STAGE_WINDOW = { narrow: 186, short: 120 };
export const SHEET = { width: 480, height: 679 };
export const EDITOR_CARD_WIDTH = 380;

export const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

export function wordsIn(reader: UiLanguage) {
  return brandingWords(READERS[reader].t, {
    limits: COMPANY_LOGO_LIMITS,
    companyName: COMPANY,
    taxLabel: IN_PACK.formats.taxIdLabel,
  });
}

export const en = wordsIn('en');
export const NEVER_SET = brandingStandingLine(
  READERS.en.t,
  { kind: 'never-set' },
  { date: String },
);
export const REFUSAL = brandingLogoRefusal(
  READERS.en.t,
  companyLogoRefusal(REFUSED_IMAGE, COMPANY_LOGO_LIMITS),
  REFUSED_FILE,
);

export const WIDTHS = [
  { name: '375', viewport: { width: 375, height: 812 }, wide: false },
  { name: '1536', viewport: { width: 1536, height: 1132 }, wide: true },
] as const;

export const stage = (page: Locator) => page.locator('.hg-branding-stage');
export const frameWindow = (page: Locator) => page.locator('.hg-preview-frame-window');
export const editor = (page: Locator, wide: boolean) =>
  wide ? page.getByRole('region', { name: en.editor }) : page.locator('.hg-branding-editor');
export const previewSwitch = (page: Locator) => page.getByRole('radiogroup', { name: en.preview });
export const partSwitch = (page: Locator) => page.getByRole('radiogroup', { name: en.edit });
export const closing = (page: Locator) => page.locator('.hg-branding-closing');

export async function heightOf(locator: Locator): Promise<number> {
  return (await settledBox(locator))?.height ?? 0;
}

/** Every frame's shared blocks: the stage on its desk, its switch row, the part switch, the profile row. */
export async function expectStageAndEditor(page: Page, body: Locator, wide: boolean) {
  const desk = stage(body);
  await expect(desk).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(desk).toHaveCSS(
    'border-top-left-radius',
    `${await resolvedLength(page, wide ? '--r-xl' : '--r-lg')}px`,
  );
  await expect(previewSwitch(body)).toBeVisible();
  const openFullSize = body.getByRole('button', { name: en.openFullSize });
  await expect(openFullSize).toBeVisible();
  await expect(partSwitch(body)).toBeVisible();
  const profile = body.getByRole('button', { name: en.profileRow });
  await expect(profile).toBeVisible();
  await expect(profile).toContainText(en.profileRowFrom);
  await expectTouchFloor([openFullSize, profile]);
  if (wide) {
    await expect(body.getByRole('region', { name: en.stage })).toBeVisible();
    const card = editor(body, true);
    await expect(card).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
    await expect(card).toHaveCSS('position', 'sticky');
    expect((await settledBox(card))?.width).toBe(EDITOR_CARD_WIDTH);
    const deskBox = await settledBox(desk);
    const cardBox = await settledBox(card);
    expect((cardBox?.x ?? 0) - ((deskBox?.x ?? 0) + (deskBox?.width ?? 0))).toBe(
      await resolvedLength(page, '--sp-8'),
    );
    expect(cardBox?.y).toBe(deskBox?.y);
  } else {
    /* At 375 the window leads and its switch row follows it. */
    const windowBox = await settledBox(frameWindow(body));
    const switchBox = await settledBox(previewSwitch(body));
    expect(switchBox?.y ?? 0).toBeGreaterThan(windowBox?.y ?? Infinity);
  }
  await expectNoSidewaysScroll(page);
}

/**
 * No box of the page reaches past the box that holds it — a word that clipped or pushed out. The
 * preview's subject is left out: it is drawn at the sheet's 480 and scaled into its window on purpose.
 */
export async function expectNothingWiderThanItsRoom(page: Page) {
  const outside = await page.evaluate(() =>
    [...document.querySelectorAll('.hg-branding *')]
      /* The window crops the scaled subject on purpose (the cover cut at 186); neither is a word. */
      .filter(
        (node) => node.closest('.hg-preview-frame-subject, .hg-preview-frame-window') === null,
      )
      .filter((node) => {
        const room = node.parentElement?.closest(
          '.hg-branding-card, .hg-branding-stage, .hg-branding-editor, .hg-branding',
        );
        if (room === null || room === undefined) return false;
        const box = node.getBoundingClientRect();
        const edges = room.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) return false;
        /* A field's own text scrolls inside it by design; any other box that scrolls clips a word. */
        const scrolls =
          !(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) &&
          node.scrollWidth > node.clientWidth + 1 &&
          getComputedStyle(node).overflowX !== 'visible';
        return box.right > edges.right + 1 || box.left < edges.left - 1 || scrolls;
      })
      .map((node) => node.getAttribute('class') ?? node.tagName),
  );
  expect(outside).toEqual([]);
}

/** The stage window's height the frame draws: the whole sheet at width, else 186 or the short 120. */
export function windowHeightAt(wide: boolean, short: boolean): number {
  if (wide) return SHEET.height;
  return short ? STAGE_WINDOW.short : STAGE_WINDOW.narrow;
}
