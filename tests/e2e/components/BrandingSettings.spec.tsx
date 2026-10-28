import { expect, test } from '@playwright/experimental-ct-react';
import {
  COMPANY,
  closing,
  editor,
  en,
  expectNothingWiderThanItsRoom,
  expectStageAndEditor,
  frameWindow,
  heightOf,
  LOGO,
  NEVER_SET,
  partSwitch,
  previewSwitch,
  REFUSAL,
  REFUSED_FILE,
  SHEET,
  STAGE_WINDOW,
  stage,
  UNDER_THE_MARK_FLOOR,
  WIDTHS,
  windowHeightAt,
  wordsIn,
} from '../support/branding-page';
import { expectNoSidewaysScroll, settledBox } from '../support/layout';
import { resolvedColour } from '../support/token';
import { BrandingAsHeld } from './BrandingSettings.story';

/**
 * The Branding page body (`SCR-M01-18`) at the board's two widths: the 375 column and the 1536
 * pair, each frame mounted in the state that shows it and read against the RFC's frame map — its
 * components in order, its tokens measured, its words the real catalog's.
 */

for (const width of WIDTHS) {
  test.describe(`at ${width.name}`, () => {
    test.use({ viewport: width.viewport });

    test('every frame at 375 and 1536', async ({ mount, page }) => {
      const { wide } = width;

      // m18-a · d18-g — saved with a logo, the cover and the logo part.
      let body = await mount(<BrandingAsHeld reader="en" companyName={COMPANY} logoSrc={LOGO} />);
      await expectStageAndEditor(page, body, wide);
      await expect(body.getByText(NEVER_SET)).toHaveCount(0);
      await expect(body.locator('.hg-branding-standing')).toBeVisible();
      await expect(previewSwitch(body).getByRole('radio', { name: en.proposal })).toBeChecked();
      await expect(partSwitch(body).getByRole('radio', { name: en.logo })).toBeChecked();
      await expect(
        body.locator('.hg-branding-logo').getByRole('img', { name: en.logoAlt }),
      ).toBeVisible();
      await expect(body.locator('.hg-branding-logo-paper')).toHaveCSS(
        'background-color',
        await resolvedColour(page, '--surface'),
      );
      await expect(body.getByRole('button', { name: en.replace })).toBeVisible();
      await expect(body.getByRole('button', { name: en.remove })).toBeVisible();
      await expect(body.getByText(en.limits)).toBeVisible();
      await expect(closing(body)).toHaveText(en.sentKeep);
      expect(await heightOf(frameWindow(body))).toBe(windowHeightAt(wide, false));
      if (wide) expect((await settledBox(frameWindow(body)))?.width).toBe(SHEET.width);
      await body.unmount();

      // m18-b — the colour part: the field drawn short, no specimen.
      body = await mount(
        <BrandingAsHeld reader="en" companyName={COMPANY} logoSrc={LOGO} part="colour" />,
      );
      await expectStageAndEditor(page, body, wide);
      await expect(body.getByText(en.colourField.short.readsWell('white'))).toBeVisible();
      await expect(body.getByText(en.colourField.specimenWord)).toHaveCount(0);
      await body.unmount();

      // m18-c · d18-h — the letterhead at its long end, on the link page.
      body = await mount(
        <BrandingAsHeld
          reader="en"
          companyName={COMPANY}
          logoSrc={LOGO}
          part="letterhead"
          letterhead="long"
          preview="link"
        />,
      );
      await expectStageAndEditor(page, body, wide);
      await expect(previewSwitch(body).getByRole('radio', { name: en.linkPage })).toBeChecked();
      await expect(body.getByRole('textbox', { name: en.tagline })).toBeVisible();
      await expect(body.getByRole('textbox', { name: en.lines })).toHaveAttribute('rows', '6');
      await expect(body.getByRole('textbox', { name: en.footerNote })).toBeVisible();
      await expect(body.getByText(en.linesHint)).toBeVisible();
      const link = body.locator('.hg-branding-link');
      await expect(link.getByText(en.linkPreview.ready)).toBeVisible();
      await expect(link.getByText(en.linkPreview.awaiting)).toBeVisible();
      await expect(link.getByText(en.linkPreview.accept)).toBeVisible();
      await expect(link.getByText(en.linkPreview.ask)).toBeVisible();
      await expect(frameWindow(body)).toHaveAttribute('data-surface', 'page');
      await body.unmount();

      // s18-k · s18-k3 — never set: the never-set line, the dropzone, empty fields at two rows.
      body = await mount(
        <BrandingAsHeld
          reader="en"
          companyName={COMPANY}
          standing="never-set"
          colour={null}
          letterhead="empty"
        />,
      );
      await expectStageAndEditor(page, body, wide);
      await expect(body.getByText(NEVER_SET)).toBeVisible();
      await expect(body.getByText(en.addLogo)).toBeVisible();
      await expect(body.getByRole('button', { name: en.replace })).toHaveCount(0);
      await partSwitch(body).getByRole('radio', { name: en.letterhead }).click();
      await expect(body.getByRole('textbox', { name: en.lines })).toHaveAttribute('rows', '2');
      await body.unmount();

      // s18-l — the save failed: the banner with its retry, the note, the act bar, no closing line.
      body = await mount(
        <BrandingAsHeld
          reader="en"
          companyName={COMPANY}
          logoSrc={LOGO}
          part="colour"
          colour="#B3401F"
          unsaved
          saveFailed
        />,
      );
      await expect(body.getByText(en.saveFailed)).toBeVisible();
      await expect(body.getByRole('button', { name: en.retry })).toBeVisible();
      await expect(body.getByText(en.notSaved)).toBeVisible();
      await expect(body.getByRole('button', { name: en.save })).toBeVisible();
      await expect(closing(body)).toHaveCount(0);
      const failure = await settledBox(body.locator('.hg-branding-failure'));
      expect(failure?.y ?? Infinity).toBeLessThan((await settledBox(stage(body)))?.y ?? 0);
      if (wide) {
        /* Across both columns, under the heading row. */
        expect(failure?.width).toBe((await settledBox(body.locator('.hg-branding')))?.width);
      }
      await body.unmount();

      // s18-m · s18-r — a held change: the act bar, sticky at 375, the card's foot at width.
      body = await mount(
        <BrandingAsHeld reader="en" companyName={COMPANY} logoSrc={LOGO} part="colour" unsaved />,
      );
      const bar = body.locator('.hg-form-action-bar');
      await expect(bar).toHaveAttribute('data-placement', wide ? 'footer' : 'sticky');
      await expect(bar.getByText(en.sentKeep)).toBeVisible();
      await expect(bar.getByRole('button', { name: en.save })).toBeVisible();
      await expect(bar.getByRole('button', { name: en.discard })).toBeVisible();
      await expect(closing(body)).toHaveCount(0);
      if (wide) await expect(editor(body, true).locator('.hg-form-action-bar')).toHaveCount(1);
      else await expect(bar).toHaveCSS('position', 'sticky');
      await bar.getByRole('button', { name: en.save }).click();
      await expect(body.getByTestId('pressed')).toHaveText('save');
      await body.unmount();

      // s18-n — a palette colour under the mark floor: the stage is cut shorter at 375 only.
      body = await mount(
        <BrandingAsHeld
          reader="en"
          companyName={COMPANY}
          logoSrc={LOGO}
          part="colour"
          colour={UNDER_THE_MARK_FLOOR}
        />,
      );
      await expect(body.getByText(en.colourField.ink.act, { exact: true })).toBeVisible();
      expect(await heightOf(frameWindow(body))).toBe(windowHeightAt(wide, true));
      await body.unmount();

      // s18-p · s18-s — a logo refused: the warning first in the logo part, the mark kept.
      body = await mount(
        <BrandingAsHeld
          reader="en"
          companyName={COMPANY}
          logoSrc={LOGO}
          refusedFile={REFUSED_FILE}
        />,
      );
      const logoPart = body.locator('.hg-branding-logo');
      await expect(logoPart.locator(':scope > *').first()).toHaveClass(/hg-banner/);
      await expect(logoPart.getByText(REFUSAL ?? '')).toBeVisible();
      await expect(logoPart.getByRole('img', { name: en.logoAlt })).toBeVisible();
      expect(await heightOf(frameWindow(body))).toBe(windowHeightAt(wide, true));
      await body.unmount();

      // s18-j at width as the 375 answer holds: the named wait in the stage, bars in the editor.
      body = await mount(<BrandingAsHeld reader="en" companyName={COMPANY} loading />);
      await expect(body.getByRole('status', { name: en.loadingCover })).toBeVisible();
      await expect(body.getByRole('status', { name: en.loading })).toBeVisible();
      await expectNoSidewaysScroll(page);
    });

    test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
      for (const reader of ['hi', 'mr'] as const) {
        const words = wordsIn(reader);
        for (const state of [
          { part: 'logo', unsaved: false },
          { part: 'letterhead', unsaved: true },
          { part: 'colour', unsaved: true },
        ] as const) {
          const body = await mount(
            <BrandingAsHeld
              reader={reader}
              companyName={COMPANY}
              logoSrc={LOGO}
              part={state.part}
              letterhead="long"
              unsaved={state.unsaved}
              saveFailed={state.unsaved}
              {...(state.part === 'logo' ? { refusedFile: REFUSED_FILE } : {})}
              titled
            />,
          );
          await expect(body.getByRole('radio', { name: words.proposal })).toBeVisible();
          await expect(body.getByRole('button', { name: words.profileRow })).toBeVisible();
          if (state.unsaved) {
            await expect(body.getByRole('button', { name: words.save })).toBeVisible();
            await expect(body.getByText(words.saveFailed)).toBeVisible();
          } else {
            await expect(body.getByText(words.limits)).toBeVisible();
            await expect(closing(body)).toHaveText(words.sentKeep);
          }
          await expectNoSidewaysScroll(page);
          await expectNothingWiderThanItsRoom(page);
          await body.unmount();
        }
      }
    });
  });
}

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the loading frame', async ({ mount, page }) => {
    const body = await mount(<BrandingAsHeld reader="en" companyName={COMPANY} loading />);
    const wait = body.getByRole('status', { name: en.loadingCover });
    await expect(wait).toBeVisible();
    await expect(wait).toHaveAttribute('aria-busy', 'true');
    await expect(wait).toHaveCSS('box-shadow', 'none');
    expect(await heightOf(wait)).toBe(STAGE_WINDOW.narrow);
    const bars = body.getByRole('status', { name: en.loading });
    await expect(bars).toBeVisible();
    await expect(bars.locator(':scope > *')).toHaveCount(3);
    /* The switch row stays; the editor is the bars alone. */
    await expect(previewSwitch(body)).toBeVisible();
    await expect(body.getByRole('button', { name: en.openFullSize })).toBeVisible();
    await expect(partSwitch(body)).toHaveCount(0);
    await expect(body.locator('.hg-branding-standing')).toHaveCount(0);
    await expect(closing(body)).toHaveCount(0);
    await expectNoSidewaysScroll(page);
  });
});
