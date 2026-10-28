import { join } from 'node:path';
import type { FirstRunProfileEvent } from '@heliogrid/domain';
import { createTranslator, FIRST_RUN_PROFILE, NAME_AND_PHOTO_EDITOR, SHELL } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { animationsSettled } from '../support/motion';
import { pngOf } from '../support/png';
import { resolvedLength } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { NameAndPhotoEditorAsHeld } from './NameAndPhotoEditor.story';

/**
 * Profile & preferences' *Edit name* editor (`SCR-M01-11`, the `edit-*` frames): a sheet at 375,
 * the 480 right panel with its close at 1536; the name field, then the photo group; one act. Each
 * frame's picture is saved beside the suite's results for the board comparison.
 */
const en = await createTranslator('en');
const F = (key: keyof typeof FIRST_RUN_PROFILE) => en.t(FIRST_RUN_PROFILE[key]);
const E = (key: keyof typeof NAME_AND_PHOTO_EDITOR) => en.t(NAME_AND_PHOTO_EDITOR[key]);
const PHOTO = `data:image/png;base64,${pngOf(8, 8).toString('base64')}`;
const PNG = { contentType: 'image/png', byteSize: 1_000, picture: PHOTO };
const TEXT =
  '.hg-sheet-title, .hg-detail-panel-title, .hg-input-label, .hg-input-message, .hg-photo-field-acts, .hg-banner, .hg-button';
const PICTURES = join(import.meta.dirname, '../../../.qa/components/name-and-photo-editor');

const typedAndSaved: readonly FirstRunProfileEvent[] = [
  { type: 'name-typed', name: 'Anjali Joshi' },
  { type: 'photo-chosen', image: PNG },
  { type: 'save' },
];
const photoFailed: readonly FirstRunProfileEvent[] = [
  ...typedAndSaved,
  { type: 'name-ended', saved: true },
  { type: 'photo-ended', saved: false },
];
const removalFailed: readonly FirstRunProfileEvent[] = [
  { type: 'photo-removed' },
  { type: 'save' },
  { type: 'photo-ended', saved: false },
];

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-edit-open: a sheet titled for the name and photo, Save full width', async ({
    mount,
    page,
  }) => {
    const card = await mount(<NameAndPhotoEditorAsHeld reader="en" />);
    const sheet = page.getByRole('dialog', { name: F('aboutTitle') });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: en.t(SHELL.close) })).toHaveCount(0);
    await expect(sheet.getByLabel(F('nameLabel'))).toHaveValue('Anjali Kulkarni');
    await expect(sheet.locator('.hg-photo-field')).toHaveAttribute('data-size', '72');
    const add = sheet.getByRole('button', { name: F('photoAdd') });
    const save = sheet.getByRole('button', { name: E('save') });
    await expectTouchFloor([add, save]);
    const body = await settledBox(sheet.locator('.hg-name-photo-editor'));
    const saveBox = await settledBox(save);
    expect(saveBox?.width ?? 0).toBeGreaterThanOrEqual((body?.width ?? 0) - 1);
    await expect(sheet.locator('.hg-name-photo-editor')).toHaveCSS(
      'row-gap',
      `${await resolvedLength(page, '--sp-5')}px`,
    );
    await expectNoSidewaysScroll(page);
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-edit-open.png` });
    await expect(card).toHaveAttribute('data-closed', 'false');
  });

  test('m-edit-photo-added: the saved photo fills the circle, with Replace and Remove', async ({
    mount,
    page,
  }) => {
    const card = await mount(<NameAndPhotoEditorAsHeld reader="en" saved={PHOTO} />);
    const sheet = page.getByRole('dialog');
    await expect(sheet.locator('.hg-photo-field img')).toHaveAttribute('src', PHOTO);
    await expect(sheet.getByRole('button', { name: F('photoReplace') })).toBeVisible();
    await sheet.getByRole('button', { name: F('photoRemove') }).click();
    await expect(sheet.locator('.hg-photo-field img')).toHaveCount(0);
    await expect(card).toHaveAttribute('data-name', 'Anjali Kulkarni');
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-edit-photo-added.png` });
  });

  test('m-edit-saving: only Save is busy; the field and the photo stay as typed', async ({
    mount,
    page,
  }) => {
    await mount(<NameAndPhotoEditorAsHeld reader="en" events={typedAndSaved} />);
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('button', { name: E('save') })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect(sheet.getByLabel(F('nameLabel'))).toHaveValue('Anjali Joshi');
    await expect(sheet.getByLabel(F('nameLabel'))).toBeEnabled();
    await expect(sheet.locator('.hg-photo-field img')).toHaveAttribute('src', PHOTO);
    await expect(sheet.locator('.hg-photo-field-mark')).not.toHaveAttribute('data-loading', 'true');
  });

  test('while a save is out, Esc and the backdrop leave the sheet open', async ({
    mount,
    page,
  }) => {
    const card = await mount(<NameAndPhotoEditorAsHeld reader="en" events={typedAndSaved} />);
    // The busy act's spinner loops while the save is out, so nothing waits for motion to end.
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(card).toHaveAttribute('data-closed', 'false');
  });

  test('m-edit-empty: Save with the name cleared answers on the field', async ({ mount, page }) => {
    const card = await mount(<NameAndPhotoEditorAsHeld reader="en" />);
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel(F('nameLabel')).fill('');
    await sheet.getByRole('button', { name: E('save') }).click();
    await expect(sheet.getByText(F('nameEmpty'))).toBeVisible();
    await expect(sheet.locator('.hg-photo-field-nameless')).toBeVisible();
    await expect(card).toHaveAttribute('data-saves', '1');
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-edit-empty.png` });
  });

  test('m-edit-refused: one banner first in the body, the typed name kept', async ({
    mount,
    page,
  }) => {
    await mount(
      <NameAndPhotoEditorAsHeld
        reader="en"
        events={[
          { type: 'name-typed', name: 'Anjali Joshi' },
          { type: 'save' },
          { type: 'name-ended', saved: false },
        ]}
      />,
    );
    const sheet = page.getByRole('dialog');
    const banner = sheet.locator('.hg-name-photo-editor > .hg-banner');
    await expect(banner).toContainText(E('nameNotSaved'));
    await expect(banner).toContainText(E('pressSave'));
    await expect(sheet.getByLabel(F('nameLabel'))).toHaveValue('Anjali Joshi');
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/m-edit-refused.png` });
  });

  for (const [frame, events, title, line] of [
    ['m-edit-photo-failed', photoFailed, F('photoFailed'), F('photoFailedWide')],
    ['a failed removal', removalFailed, E('photoNotRemoved'), E('photoNotRemovedLine')],
  ] as const) {
    test(`${frame}: the name reads saved, the photo group its banner, the act Done`, async ({
      mount,
      page,
    }) => {
      const card = await mount(
        <NameAndPhotoEditorAsHeld reader="en" saved={PHOTO} events={events} />,
      );
      const sheet = page.getByRole('dialog');
      await expect(sheet.getByText(F('nameSaved'))).toBeVisible();
      const group = sheet.locator('.hg-photo-field');
      await expect(group.locator('.hg-photo-field-banner')).toContainText(title);
      await expect(group.locator('.hg-photo-field-banner')).toContainText(line);
      await expect(group.getByRole('button', { name: F('photoRetry') })).toBeVisible();
      // The board draws the initials and the retry alone: no picture, no Remove.
      await expect(group.locator('img')).toHaveCount(0);
      await expect(group.getByRole('button', { name: F('photoRemove') })).toHaveCount(0);
      await sheet.getByRole('button', { name: E('done') }).click();
      await expect(card).toHaveAttribute('data-saves', '1');
      await animationsSettled(page);
      await page.screenshot({ path: `${PICTURES}/${frame.replaceAll(' ', '-')}.png` });
    });
  }

  test('a photo the device refused reads its limit inside the photo group', async ({
    mount,
    page,
  }) => {
    await mount(
      <NameAndPhotoEditorAsHeld
        reader="en"
        events={[
          {
            type: 'photo-chosen',
            image: { contentType: 'image/gif', byteSize: 1_000, picture: null },
          },
        ]}
      />,
    );
    await expect(page.locator('.hg-photo-field-banner')).toContainText(F('photoRefused'));
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} nothing clips, the failed photo included`, async ({ mount, page }) => {
      await mount(<NameAndPhotoEditorAsHeld reader={reader} saved={PHOTO} events={photoFailed} />);
      await animationsSettled(page);
      await expectNothingClipped(page, TEXT);
      await expectNoSidewaysScroll(page);
      await page.screenshot({ path: `${PICTURES}/m-${reader}.png` });
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('d-edit-open: the 480 right panel with its close; the photo 120, chosen or dropped', async ({
    mount,
    page,
  }) => {
    const card = await mount(<NameAndPhotoEditorAsHeld reader="en" />);
    const panel = page.getByRole('dialog', { name: F('aboutTitle') });
    await animationsSettled(page);
    const box = await settledBox(panel);
    expect(box?.width).toBe(480);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBe(1536);
    await expect(panel.locator('.hg-photo-field')).toHaveAttribute('data-size', '120');
    await expect(panel.getByRole('button', { name: F('photoChoose') })).toBeVisible();
    await page.screenshot({ path: `${PICTURES}/d-edit-open.png` });
    await panel.getByRole('button', { name: en.t(SHELL.close) }).click();
    await expect(card).toHaveAttribute('data-closed', 'true');
  });

  test('d-edit-photo-failed: the banner above the act in the 120 column', async ({
    mount,
    page,
  }) => {
    await mount(<NameAndPhotoEditorAsHeld reader="en" saved={PHOTO} events={photoFailed} />);
    const panel = page.getByRole('dialog');
    await expect(panel.locator('.hg-photo-field-banner')).toContainText(F('photoFailedWide'));
    await expect(panel.getByRole('button', { name: E('done') })).toBeVisible();
    await animationsSettled(page);
    await page.screenshot({ path: `${PICTURES}/d-edit-photo-failed.png` });
  });

  test('reduced motion: the panel is in place on its first frame', async ({ mount, page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount(<NameAndPhotoEditorAsHeld reader="en" />);
    const panel = page.getByRole('dialog');
    // The duration tokens fall to 1ms under reduced motion: nothing moves for longer than that.
    const longest = await page.evaluate(() =>
      Math.max(
        0,
        ...document.getAnimations().map((motion) => Number(motion.effect?.getTiming().duration)),
      ),
    );
    expect(longest).toBeLessThanOrEqual(1);
    await animationsSettled(page);
    const box = await settledBox(panel);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBe(1536);
  });

  test('Save pressed while the panel is still moving in lands', async ({ mount, page }) => {
    const card = await mount(<NameAndPhotoEditorAsHeld reader="en" />);
    // Still off its resting place, so no pointer reaches it yet: the press is sent to the button.
    const moving = await page.evaluate(() =>
      document.getAnimations().some((motion) => motion.playState === 'running'),
    );
    expect(moving).toBe(true);
    await page.getByRole('button', { name: E('save') }).dispatchEvent('click');
    await expect(card).toHaveAttribute('data-saves', '1');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} nothing clips`, async ({ mount, page }) => {
      await mount(<NameAndPhotoEditorAsHeld reader={reader} saved={PHOTO} events={photoFailed} />);
      await animationsSettled(page);
      await expectNothingClipped(page, TEXT);
      await page.screenshot({ path: `${PICTURES}/d-${reader}.png` });
    });
  }
});
