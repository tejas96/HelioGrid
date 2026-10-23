import {
  formatPhone,
  grantLine,
  IN_PACK,
  ROLE_PRESETS,
  type RolePreset,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  assignRolesWords,
  createTranslator,
  grantLineWords,
  SHELL,
  teamStatusWord,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { resolvedColour, resolvedLength } from '../support/token';
import { AssignRolesAsHeld } from './AssignRoles.story';

/**
 * Assign Roles (`SCR-M01-13`): the sheet at 375 and the 560 side panel at 1536 — the head with the
 * status and the phone, *Presets*, the twelve rows, the grant card and *Save roles*. Ticks change
 * the sentence before any save (`M01-20`); the sole EPC Owner and your own EPC Owner cannot be
 * cleared. The words are the catalog's in each language.
 */
const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const [OWNER, , , SURVEY, DESIGN, , , INSTALL, , FINANCE, OPERATIONS] = ROLE_PRESETS;
const VIKRAM: readonly RolePreset[] = [SURVEY, DESIGN, INSTALL];

const wordsIn = (reader: UiLanguage) =>
  assignRolesWords(READERS[reader].t, {
    firstName: 'Vikram',
    companyName: 'Suryodaya Solar',
    locks: {},
  });
const sentenceOf = (roles: readonly RolePreset[], reader: UiLanguage = 'en', name = 'Vikram') =>
  grantLineWords(READERS[reader].t, name, grantLine(roles).speakers)
    .parts.map((part) => part.text)
    .join('');
const en = wordsIn('en');
const rowOf = (page: Page, preset: RolePreset) =>
  page.getByRole('checkbox', { name: en.rows[ROLE_PRESETS.indexOf(preset)]?.title ?? '' });

for (const [width, height, form] of [
  [375, 812, 'sheet'],
  [1536, 960, 'panel'],
] as const) {
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test(`default: the head, twelve rows, the card, and Save off with its reason (${form})`, async ({
      mount,
      page,
    }) => {
      await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} />);
      const editor = page.getByRole('dialog', { name: 'Vikram Deshpande', exact: true });
      await expect(editor).toBeVisible();
      await expect(editor.getByText(en.overline)).toBeVisible();
      await expect(editor.getByText(teamStatusWord(READERS.en.t, 'active'))).toBeVisible();
      await expect(editor.getByText(formatPhone(IN_PACK.formats, '+919876543210'))).toHaveCSS(
        'font-family',
        /Geist Mono/u,
      );
      await expect(editor.getByText(en.presets, { exact: true })).toBeVisible();
      // The board draws the line `--sp-3` under the sheet's head and `--sp-1` under the panel's.
      await expect(editor.getByText(en.presets, { exact: true })).toHaveCSS(
        'margin-top',
        `${await resolvedLength(page, form === 'panel' ? '--sp-1' : '--sp-3')}px`,
      );
      await expect(editor.getByRole('checkbox')).toHaveCount(12);
      for (const preset of ROLE_PRESETS) {
        await expect(rowOf(page, preset)).toHaveAttribute(
          'aria-checked',
          VIKRAM.includes(preset) ? 'true' : 'false',
        );
      }
      await expect(editor.getByText(en.recorded)).toBeVisible();
      const card = editor.getByRole('region', { name: en.gives });
      await expect(card).toHaveCSS(
        'background-color',
        await resolvedColour(page, '--accent-subtle'),
      );
      await expect(card.locator('.hg-grant-card-sentence')).toHaveText(sentenceOf(VIKRAM));
      await expect(card.locator('strong')).toHaveText(
        grantLineWords(READERS.en.t, 'Vikram', VIKRAM)
          .parts.filter((part) => part.strong)
          .map((part) => part.text),
      );
      await expect(card.locator('.hg-grant-card-cluster')).toHaveAttribute('aria-hidden', 'true');
      const save = editor.getByRole('button', { name: en.save });
      await expect(save).toHaveAttribute('aria-disabled', 'true');
      await expect(save).toHaveAccessibleDescription(en.saveOff('unchanged') ?? '');
      if (form === 'panel') {
        const box = await editor.boundingBox();
        expect(Math.round(box?.width ?? 0)).toBe(560);
      }
      await expectNoSidewaysScroll(page);
    });

    test('live: a tick changes the sentence before any save, and Save turns on', async ({
      mount,
      page,
    }) => {
      const frame = await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} />);
      await rowOf(page, FINANCE).click();
      await rowOf(page, OPERATIONS).click();
      const after = [...VIKRAM, FINANCE, OPERATIONS];
      await expect(page.locator('.hg-grant-card-sentence')).toHaveText(sentenceOf(after));
      await expect(page.locator('.hg-grant-card .hg-avatar')).toHaveCount(4);
      await expect(page.locator('.hg-grant-card')).toContainText('+1');
      const save = page.getByRole('button', { name: en.save });
      await expect(save).not.toHaveAttribute('aria-disabled', 'true');
      await save.click();
      await expect(frame).toHaveAttribute('data-saved', after.join(','));
    });

    test('empty: every tick cleared says they would hold nothing, and Save says why', async ({
      mount,
      page,
    }) => {
      await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} />);
      for (const preset of VIKRAM) await rowOf(page, preset).click();
      await expect(page.locator('.hg-grant-card-sentence')).toHaveText(sentenceOf([]));
      await expect(page.locator('.hg-grant-card-cluster')).toHaveCount(0);
      await expect(page.getByRole('button', { name: en.save })).toHaveAccessibleDescription(
        en.saveOff('empty') ?? '',
      );
    });

    for (const lock of ['sole-owner', 'own-admin'] as const) {
      for (const reader of ['en', 'hi', 'mr'] as const) {
        test(`guard (${lock}, ${reader}): EPC Owner stays held and off, and the row says why`, async ({
          mount,
          page,
        }) => {
          await mount(
            <AssignRolesAsHeld
              reader={reader}
              name="Rajesh Kulkarni"
              held={[OWNER]}
              locks={{ epc_owner: lock }}
            />,
          );
          const words = assignRolesWords(READERS[reader].t, {
            firstName: 'Rajesh',
            companyName: 'Suryodaya Solar',
            locks: { epc_owner: lock },
          });
          const owner = page.getByRole('checkbox', { name: words.rows[0]?.title ?? '' });
          await expect(owner).toHaveAttribute('aria-checked', 'true');
          await expect(owner).toHaveAttribute('aria-disabled', 'true');
          await expect(owner).toContainText(words.rows[0]?.lockReason ?? '');
          await expect(owner).toBeInViewport();
          await owner.focus();
          await page.keyboard.press('Space');
          await expect(owner).toHaveAttribute('aria-checked', 'true');
          await expect(page.locator('.hg-grant-card-sentence')).toHaveText(
            sentenceOf([OWNER], reader, 'Rajesh'),
          );
          await expectNoSidewaysScroll(page);
          await expectNothingClipped(page, '.hg-option-card-title, .hg-action-reason');
        });
      }
    }

    for (const reader of ['hi', 'mr'] as const) {
      test(`empty (${reader}): every tick cleared, the sentence and Save's reason fit`, async ({
        mount,
        page,
      }) => {
        await mount(<AssignRolesAsHeld reader={reader} held={VIKRAM} />);
        const words = wordsIn(reader);
        for (const preset of VIKRAM) {
          await page
            .getByRole('checkbox', { name: words.rows[ROLE_PRESETS.indexOf(preset)]?.title ?? '' })
            .click();
        }
        await expect(page.locator('.hg-grant-card-sentence')).toHaveText(sentenceOf([], reader));
        await expect(page.getByRole('button', { name: words.save })).toHaveAccessibleDescription(
          words.saveOff('empty') ?? '',
        );
        await expectNothingClipped(page, '.hg-grant-card-sentence');
      });
    }

    for (const reader of ['hi', 'mr'] as const) {
      test(`${reader}: the words fit, nothing clips, the verb after the list`, async ({
        mount,
        page,
      }) => {
        await mount(<AssignRolesAsHeld reader={reader} held={[...VIKRAM, FINANCE, OPERATIONS]} />);
        const words = wordsIn(reader);
        await expect(page.getByRole('button', { name: words.save })).toBeVisible();
        await expect(page.locator('.hg-grant-card-sentence')).toHaveText(
          sentenceOf([...VIKRAM, FINANCE, OPERATIONS], reader),
        );
        await expectNoSidewaysScroll(page);
        await expectNothingClipped(
          page,
          '.hg-option-card-title, .hg-grant-card-sentence, .hg-sheet-title, .hg-detail-panel-title',
        );
      });
    }

    test('reduced motion shows the editor at its end state at once', async ({ mount, page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} />);
      await animationsSettled(page);
      await expect(page.getByRole('dialog')).toBeInViewport();
    });

    test('close dismisses the editor', async ({ mount, page }) => {
      const frame = await mount(<AssignRolesAsHeld reader="en" held={VIKRAM} />);
      await page
        .getByRole('dialog')
        .getByRole('button', { name: READERS.en.t(SHELL.close) })
        .click();
      await expect(frame).toHaveAttribute('data-closed', 'true');
    });
  });
}
