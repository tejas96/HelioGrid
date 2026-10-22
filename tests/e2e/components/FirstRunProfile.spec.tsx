import type { FirstRunProfileEvent } from '@heliogrid/domain';
import { createTranslator, FIRST_RUN_PROFILE } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { FirstRunProfileAt } from './FirstRunProfile.story';

/**
 * First-Run Profile (`SCR-M01-09`): every frame of the RFC's map at 375 and 1536 — the name the
 * inviter typed, the photo, the one act — and the same screen in Hindi and Marathi.
 */
const en = await createTranslator('en');
const words = (message: Parameters<typeof en.t>[0]) =>
  en.t(message, {
    first: 'Rajesh',
    name: 'Anjali Kulkarni',
    company: 'Suryodaya Solar',
    megabytes: 3,
    maxMegabytes: 2,
  });
const PNG = { contentType: 'image/png', byteSize: 1_000, picture: 'blob:a' };

const FRAMES = {
  normal: [],
  empty: [{ type: 'name-typed', name: '' }],
  emptyPressed: [{ type: 'name-typed', name: '' }, { type: 'save' }],
  errorSave: [{ type: 'save' }, { type: 'name-ended', saved: false }],
  errorPhoto: [
    { type: 'photo-chosen', image: PNG },
    { type: 'save' },
    { type: 'name-ended', saved: true },
    { type: 'photo-ended', saved: false },
  ],
  photoAdded: [{ type: 'photo-chosen', image: PNG }],
  photoRefused: [{ type: 'photo-chosen', image: { ...PNG, byteSize: 3_000_000 } }],
} satisfies Record<string, readonly FirstRunProfileEvent[]>;

async function sideways(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const [width, height] of [
  [375, 812],
  [1536, 1000],
] as const) {
  const wide = width === 1536;
  test.describe(`at ${width}`, () => {
    test.use({ viewport: { width, height } });

    test('normal: the heading, the name the inviter typed with who typed it, the photo, one act', async ({
      mount,
      page,
    }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.normal} />);
      await expect(
        root.getByRole('heading', { level: 1, name: words(FIRST_RUN_PROFILE.heading) }),
      ).toBeVisible();
      await expect(
        root.getByRole('textbox', { name: words(FIRST_RUN_PROFILE.nameLabel) }),
      ).toHaveValue('Anjali Kulkarni');
      await expect(root.getByText(words(FIRST_RUN_PROFILE.nameFromInvite))).toBeVisible();
      const chooseName = wide ? FIRST_RUN_PROFILE.photoChoose : FIRST_RUN_PROFILE.photoAdd;
      await expect(root.getByRole('button', { name: words(chooseName) })).toBeVisible();
      await expect(root.getByRole('button', { name: words(FIRST_RUN_PROFILE.save) })).toBeEnabled();
      await expect(root.getByText(words(FIRST_RUN_PROFILE.reasonName))).toBeVisible({
        visible: wide,
      });
      expect(await sideways(page)).toBe(0);
    });

    test('the photo sits under the name on the phone and above it at 1536; the act right under both', async ({
      mount,
    }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.normal} />);
      const field = await root.getByRole('textbox').boundingBox();
      const photo = await root
        .getByRole('group', { name: words(FIRST_RUN_PROFILE.photoLabel) })
        .boundingBox();
      const act = await root
        .getByRole('button', { name: words(FIRST_RUN_PROFILE.save) })
        .boundingBox();
      if (field === null || photo === null || act === null) throw new Error('not drawn');
      if (wide) expect(photo.y).toBeLessThan(field.y);
      else expect(field.y).toBeLessThan(photo.y);
      expect(act.y).toBeGreaterThan(Math.max(field.y, photo.y));
    });

    test('empty and empty pressed: the helper names what was typed, then the field says it is empty', async ({
      mount,
    }) => {
      const empty = await mount(<FirstRunProfileAt reader="en" events={FRAMES.empty} />);
      await expect(empty.getByText(words(FIRST_RUN_PROFILE.nameEmptied))).toBeVisible();
      await expect(empty.getByText(words(FIRST_RUN_PROFILE.photoOptionalNameless))).toBeVisible();
      await empty.getByRole('button', { name: words(FIRST_RUN_PROFILE.save) }).click();
      await expect(empty.getByText(words(FIRST_RUN_PROFILE.nameEmpty))).toBeVisible();
      await empty.unmount();
      const pressed = await mount(<FirstRunProfileAt reader="en" events={FRAMES.emptyPressed} />);
      await expect(pressed.getByText(words(FIRST_RUN_PROFILE.nameEmpty))).toBeVisible();
    });

    test('error-save: the refusal banner, the name kept, the act tries again', async ({
      mount,
    }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.errorSave} />);
      await expect(root.getByText(words(FIRST_RUN_PROFILE.saveFailed))).toBeVisible();
      await expect(root.getByText(words(FIRST_RUN_PROFILE.saveFailedLine))).toBeVisible();
      await expect(root.getByRole('textbox')).toHaveValue('Anjali Kulkarni');
      const banner = await root.getByText(words(FIRST_RUN_PROFILE.saveFailed)).boundingBox();
      const field = await root.getByRole('textbox').boundingBox();
      if (banner === null || field === null) throw new Error('not drawn');
      // Under the heading on the phone; just above the act at 1536 (ruling 11).
      if (wide) expect(banner.y).toBeGreaterThan(field.y);
      else expect(banner.y).toBeLessThan(field.y);
    });

    test('error-photo: the name reads saved, the photo retries, the act continues without it', async ({
      mount,
    }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.errorPhoto} />);
      await expect(root.getByText(words(FIRST_RUN_PROFILE.nameSaved))).toBeVisible();
      await expect(root.getByText(words(FIRST_RUN_PROFILE.photoFailed))).toBeVisible();
      const line = wide ? FIRST_RUN_PROFILE.photoFailedWide : FIRST_RUN_PROFILE.photoFailedPhone;
      await expect(root.getByText(words(line))).toBeVisible();
      await expect(
        root.getByRole('button', { name: words(FIRST_RUN_PROFILE.continueWithout) }),
      ).toBeVisible();
      await root.getByRole('button', { name: words(FIRST_RUN_PROFILE.photoRetry) }).click();
      await expect(root.getByTestId('pressed')).toHaveText('retry-photo');
    });

    test('photo-added: Replace and Remove, and Remove brings the initials back', async ({
      mount,
    }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.photoAdded} />);
      await expect(root.getByText(words(FIRST_RUN_PROFILE.photoHeld))).toBeVisible();
      await expect(
        root.getByRole('button', { name: words(FIRST_RUN_PROFILE.photoReplace) }),
      ).toBeVisible();
      await root.getByRole('button', { name: words(FIRST_RUN_PROFILE.photoRemove) }).click();
      await expect(root.getByText(words(FIRST_RUN_PROFILE.photoOptional))).toBeVisible();
    });

    test('photo-refused: the banner in the photo group names the size against the limit', async ({
      mount,
    }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.photoRefused} />);
      await expect(root.getByText(words(FIRST_RUN_PROFILE.photoRefused))).toBeVisible();
      await expect(root.getByText('3 MB · needs 2 MB or less')).toBeVisible();
    });

    test('loading: the name waits, and the act says why it is off', async ({ mount }) => {
      const root = await mount(<FirstRunProfileAt reader="en" events={[]} arrived={false} />);
      await expect(root.getByRole('textbox')).toHaveCount(0);
      await expect(
        root.getByRole('button', { name: words(FIRST_RUN_PROFILE.save) }),
      ).toHaveAttribute('aria-disabled', 'true');
    });

    for (const reader of ['hi', 'mr'] as const) {
      test(`in ${reader}: the screen draws whole, nothing sideways`, async ({ mount, page }) => {
        const root = await mount(<FirstRunProfileAt reader={reader} events={FRAMES.errorPhoto} />);
        await expect(root.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(root.getByRole('textbox')).toBeVisible();
        expect(await sideways(page)).toBe(0);
      });
    }
  });
}

test.describe('at 1536 only', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('the task is one column at the door measure, centred in the task pane both ways', async ({
    mount,
    page,
  }) => {
    const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.normal} />);
    const column = root.locator('.hg-first-run');
    const box = await column.boundingBox();
    const pane = await page.locator('.hg-door-task').boundingBox();
    const measure = await column.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).getPropertyValue('--door-measure')),
    );
    if (box === null || pane === null) throw new Error('not drawn');
    expect(box.width).toBeCloseTo(measure, 0);
    expect(box.x + box.width / 2).toBeCloseTo(pane.x + pane.width / 2, 0);
    expect(box.y + box.height / 2).toBeCloseTo(pane.y + pane.height / 2, 0);
  });

  test('the name field takes the focus, and Enter saves', async ({ mount }) => {
    const root = await mount(<FirstRunProfileAt reader="en" events={FRAMES.normal} />);
    await expect(root.getByRole('textbox')).toBeFocused();
    await root.getByRole('textbox').press('Enter');
    await expect(root.getByTestId('pressed')).toHaveText('save');
  });
});
