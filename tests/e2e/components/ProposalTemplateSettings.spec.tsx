import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll } from '../support/layout';
import {
  actBar,
  card,
  en,
  englishName,
  expectNothingWiderThanItsRoom,
  expectStageAndEditor,
  frameWindow,
  heightOf,
  pageEnd,
  partSwitch,
  phaseTitles,
  STAGE_WINDOW,
  stage,
  WIDTHS,
  windowHeightFor,
  wordsIn,
} from '../support/proposal-template-page';
import { expectTouchFloor } from '../support/touch-target';
import { ProposalTemplateAsHeld } from './ProposalTemplateSettings.story';

/**
 * The Proposal template page body (`SCR-M01-19`) at the board's two widths: the 375 column and the
 * 1536 pair, each frame mounted in the state that shows it and read against the RFC's §6 frame
 * map — its components in order, its tokens measured, its words the real catalog's.
 */

for (const width of WIDTHS) {
  test.describe(`at ${width.name}`, () => {
    test.use({ viewport: width.viewport });

    test('every frame at 375 and 1536', async ({ mount, page }) => {
      const { wide } = width;

      // m19-a · m19-i — saved, Cover: the strip, the ruled name, About, the kW figure and its tier.
      let body = await mount(<ProposalTemplateAsHeld reader="en" />);
      await expectStageAndEditor(page, body, wide);
      await expect(body.getByText(en.intro)).toBeVisible();
      await expect(partSwitch(body).getByRole('radio', { name: en.cover })).toBeChecked();
      await expect(body.getByRole('tablist', { name: en.language })).toBeVisible();
      await expect(body.getByText(en.proposal, { exact: true }).first()).toBeVisible();
      await expect(body.getByRole('textbox', { name: en.about })).toHaveAttribute(
        'rows',
        wide ? '5' : '3',
      );
      await expect(body.getByText(en.counts.totalCapacityInstalledKw)).toBeVisible();
      await expect(body.getByText(en.declaredByYou)).toHaveCount(1);
      await expect(body.getByText(en.counts.happyCustomers)).toBeVisible();
      await expect(body.getByText(en.counts.citiesServed)).toBeVisible();
      await expect(pageEnd(body)).toHaveText(en.pageEnd);
      await expect(body.getByText(en.teachTitle)).toHaveCount(0);
      if (wide) await expect(card(body).locator('.hg-template-end')).toHaveCount(1);
      else expect(await heightOf(frameWindow(body))).toBe(windowHeightFor('cover'));
      await body.unmount();

      // m19-b · m19-j — Sections: 6 of 8, nine rows, the terms row a lock and no switch.
      body = await mount(<ProposalTemplateAsHeld reader="en" part="sections" />);
      await expectStageAndEditor(page, body, wide);
      await expect(body.getByText(en.sectionsPrint(6, 8))).toBeVisible();
      await expect(body.locator('.hg-template-section')).toHaveCount(9);
      const switches = body.getByRole('switch');
      await expect(switches).toHaveCount(8);
      await expect(body.getByText(en.alwaysPrints)).toBeVisible();
      await expect(
        body.locator('.hg-template-section[data-floor]').getByRole('switch'),
      ).toHaveCount(0);
      await expect(body.locator('.hg-template-section').first()).toHaveCSS(
        'border-top-style',
        'solid',
      );
      await body.locator('.hg-template-section').first().locator('.hg-switch').click();
      await expect(body.getByText(en.sectionsPrint(5, 8))).toBeVisible();
      if (!wide) expect(await heightOf(frameWindow(body))).toBe(windowHeightFor('sections'));
      await body.unmount();

      // m19-c · m19-i2 — Terms: the strip, the editor named in the strip's language, its pages.
      body = await mount(<ProposalTemplateAsHeld reader="en" part="terms" />);
      await expectStageAndEditor(page, body, wide);
      await expect(body.getByRole('tablist', { name: en.language })).toBeVisible();
      await expect(body.getByText(en.termsIn(englishName))).toBeVisible();
      await expect(body.getByText(en.pages(1))).toBeVisible();
      if (!wide) expect(await heightOf(frameWindow(body))).toBe(windowHeightFor('terms'));
      await body.unmount();

      // m19-e · m19-k — Timeline: six phases, each with its pencil, then *Add a phase*.
      body = await mount(<ProposalTemplateAsHeld reader="en" part="timeline" />);
      await expectStageAndEditor(page, body, wide);
      const [first] = phaseTitles('en', 1);
      const pencil = body.getByRole('button', { name: en.editPhase(first ?? '') });
      await expect(pencil).toBeVisible();
      await expect(body.getByRole('button', { name: en.editPhase(first ?? '') })).toHaveCount(1);
      const add = body.getByRole('button', { name: en.addPhase });
      await expect(add).toBeVisible();
      await expectTouchFloor([pencil, add]);
      await pencil.click();
      await expect(body.getByTestId('pressed')).toHaveText('edit:0');
      if (!wide) expect(await heightOf(frameWindow(body))).toBe(windowHeightFor('timeline'));
      await body.unmount();
    });

    test('the never-saved frames at 375 and 1536', async ({ mount, page }) => {
      // m19-n2 · n2b · n3 · n3b — never saved: no standing, the teaching banner, each part's source.
      for (const part of ['cover', 'sections', 'terms', 'timeline'] as const) {
        const body = await mount(<ProposalTemplateAsHeld reader="en" part={part} neverSaved />);
        await expect(body.getByText(en.teachTitle)).toBeVisible();
        await expect(body.getByText(en.teachBody)).toBeVisible();
        await expect(body.getByText(en.platform[part].layer, { exact: true })).toBeVisible();
        await expect(body.getByRole('tablist', { name: en.language })).toHaveCount(0);
        if (part === 'cover') await expect(body.getByText(en.declaredByYou)).toHaveCount(0);
        if (part === 'sections') await expect(body.getByText(en.sectionsPrint(8, 8))).toBeVisible();
        const writeOwn = body.getByRole('button', { name: en.writeOwn });
        await expectTouchFloor([writeOwn]);
        await writeOwn.click();
        await expect(body.getByTestId('pressed')).toHaveText(`write-own:${part}`);
        await expectNoSidewaysScroll(page);
        await body.unmount();
      }
    });

    test('a held change whose save failed at 375 and 1536', async ({ mount, page }) => {
      const { wide } = width;
      // m19-n4 · m19-n8 — a held change whose save failed: the banner over the act bar, no page end.
      const body = await mount(
        <ProposalTemplateAsHeld reader="en" part="sections" unsaved saveFailed />,
      );
      const bar = actBar(body);
      await expect(bar).toHaveAttribute('data-placement', wide ? 'footer' : 'sticky');
      await expect(bar.getByText(en.consequence)).toBeVisible();
      await expect(bar.getByRole('button', { name: en.save })).toBeVisible();
      await expect(bar.getByRole('button', { name: en.discard })).toBeVisible();
      await expect(pageEnd(body)).toHaveCount(0);
      const failure = body.getByText(en.saveFailed);
      await expect(failure).toBeVisible();
      await expect(body.getByText(en.saveFailedBody)).toBeVisible();
      expect((await failure.boundingBox())?.y ?? Infinity).toBeLessThan(
        (await bar.boundingBox())?.y ?? 0,
      );
      if (wide) await expect(card(body).locator('.hg-form-action-bar')).toHaveCount(1);
      else await expect(body.locator('.hg-template-foot')).toHaveCSS('position', 'sticky');
      await bar.getByRole('button', { name: en.save }).click();
      await expect(body.getByTestId('pressed')).toHaveText('save');
      await expectNoSidewaysScroll(page);
      await body.unmount();
    });

    test('the phase cap at 375 and 1536', async ({ mount, page }) => {
      // The 20-phase cap: *Add a phase* gives way to the cap's line.
      const body = await mount(<ProposalTemplateAsHeld reader="en" part="timeline" atCap />);
      await expect(body.getByText(en.phaseCap)).toBeVisible();
      await expect(body.getByRole('button', { name: en.addPhase })).toHaveCount(0);
      await expectNoSidewaysScroll(page);
    });

    test('Hindi and Marathi at 375 and 1536', async ({ mount, page }) => {
      for (const reader of ['hi', 'mr'] as const) {
        const words = wordsIn(reader);
        for (const state of [
          { part: 'cover', held: false },
          { part: 'sections', held: true },
          { part: 'terms', held: false },
          { part: 'timeline', held: true },
        ] as const) {
          const body = await mount(
            <ProposalTemplateAsHeld
              reader={reader}
              part={state.part}
              unsaved={state.held}
              saveFailed={state.held}
              titled
            />,
          );
          await expect(body.getByRole('radiogroup', { name: words.edit })).toBeVisible();
          await expect(body.getByRole('button', { name: words.bankRow })).toBeVisible();
          if (state.held) {
            await expect(body.getByRole('button', { name: words.save })).toBeVisible();
            await expect(body.getByText(words.saveFailed)).toBeVisible();
          } else {
            await expect(body.locator('.hg-template-end')).toHaveText(words.pageEnd);
          }
          await expectNoSidewaysScroll(page);
          await expectNothingWiderThanItsRoom(page);
          await body.unmount();
        }
        const fresh = await mount(<ProposalTemplateAsHeld reader={reader} neverSaved titled />);
        await expect(fresh.getByText(words.teachTitle)).toBeVisible();
        await expectNothingWiderThanItsRoom(page);
        await fresh.unmount();
      }
    });
  });
}

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the loading frame', async ({ mount, page }) => {
    const body = await mount(<ProposalTemplateAsHeld reader="en" loading />);
    const wait = body.getByRole('status', { name: en.loadingPreview });
    await expect(wait).toBeVisible();
    await expect(wait).toHaveAttribute('aria-busy', 'true');
    expect(await heightOf(wait)).toBe(STAGE_WINDOW.tall);
    const bars = body.getByRole('status', { name: en.loading });
    await expect(bars).toBeVisible();
    await expect(bars.locator(':scope > *')).toHaveCount(3);
    /* The caption row stays; the editor is the bars alone, with no rows and no page end. */
    await expect(stage(body).getByRole('button', { name: en.openFullSize })).toBeVisible();
    await expect(body.getByText(en.intro)).toBeVisible();
    await expect(partSwitch(body)).toHaveCount(0);
    await expect(body.getByRole('button', { name: en.bankRow })).toHaveCount(0);
    await expect(pageEnd(body)).toHaveCount(0);
    await expectNoSidewaysScroll(page);
  });

  test('the stage notes only a template change', async ({ mount }) => {
    /* m19-n6: a phase moved holds a change — the act bar rises, the stage keeps no note. */
    let body = await mount(<ProposalTemplateAsHeld reader="en" part="timeline" held />);
    await expect(actBar(body)).toBeVisible();
    await expect(body.getByText(en.notSaved)).toHaveCount(0);
    await body.unmount();

    /* m19-n5: a section switched off is a template change — the note under the window. */
    body = await mount(<ProposalTemplateAsHeld reader="en" part="sections" unsaved />);
    await expect(actBar(body)).toBeVisible();
    await expect(stage(body).getByText(en.notSaved)).toBeVisible();
  });
});
