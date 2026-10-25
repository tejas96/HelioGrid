import { COMPANY_LOGO_LIMITS } from '@heliogrid/domain';
import { brandingWords, createTranslator } from '@heliogrid/i18n';
import { DocumentPreview, PreviewFrame } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

/**
 * The stage while the tenant's values load (`SCR-M01-18`'s s18-j): the frame keeps its footprint
 * and draws the theme's sweep over the sunken ground — never the subject's white paper — as a busy
 * region named by what it loads, with no subject drawn. Reduced motion stills the sweep, and the
 * sweep ends with the wait.
 */
const en = await createTranslator('en');

/* Tenant data, as a company types it — never a word of the product's. */
const COMPANY = 'Suryodaya Solar Pvt Ltd';

/* Only the loading words are read; the other facts fill the signature. */
const words = brandingWords(en.t, {
  limits: COMPANY_LOGO_LIMITS,
  companyName: COMPANY,
  taxLabel: '',
});

/** The board's stage window at 375: a 480×679 sheet, cut at 186. */
const STAGE = { designWidth: 480, designHeight: 679, minScale: 0.6, maxHeight: 186 } as const;

const backgroundPosition = (selector: string) =>
  `getComputedStyle(document.querySelector('${selector}')).backgroundPosition`;

test('loading names what it loads', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const frame = await mount(
    <PreviewFrame {...STAGE} loading loadingLabel={words.loadingCover}>
      <DocumentPreview sample={false} parts={['cover']} companyName={COMPANY} caption="" />
    </PreviewFrame>,
  );
  const wait = page.getByRole('status', { name: words.loadingCover });
  await expect(wait).toHaveAttribute('aria-busy', 'true');
  await expect(wait).toHaveCSS('animation-name', 'hg-sheet-shimmer');
  await expect(wait).toHaveCSS('box-shadow', 'none');
  expect((await wait.boundingBox())?.height).toBe(STAGE.maxHeight);
  /* No subject is drawn, or read out, while it waits. */
  await expect(frame.getByText(COMPANY)).toBeHidden();
  await expect(frame.locator('.hg-preview-frame-subject')).toHaveAttribute('aria-hidden', 'true');

  /* The sweep runs … */
  const stage = '.hg-preview-frame-window';
  const first = await page.evaluate(backgroundPosition(stage));
  await page.waitForTimeout(200);
  expect(await page.evaluate(backgroundPosition(stage))).not.toBe(first);

  /* … and reduced motion stills it. */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const still = await page.evaluate(backgroundPosition(stage));
  await page.waitForTimeout(200);
  expect(await page.evaluate(backgroundPosition(stage))).toBe(still);

  /* The wait ends, the loop with it, and the subject is drawn. */
  await frame.update(
    <PreviewFrame {...STAGE}>
      <DocumentPreview sample={false} parts={['cover']} companyName={COMPANY} caption="" />
    </PreviewFrame>,
  );
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.locator(stage)).toHaveCSS('animation-name', 'none');
  await expect(frame.getByText(COMPANY)).toBeVisible();
});
