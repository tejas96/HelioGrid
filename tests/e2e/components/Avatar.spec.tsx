import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { GlyphGroupOnTint } from './Avatar.story';

/**
 * Design-system change 18 (`SCR-M01-13`'s grant card): a thing drawn as a glyph disc — white, the
 * glyph in the accent, no initials and no tint — and a group whose 2px ring takes the ground it
 * sits on, so the overlap reads on a tinted card.
 */

test('a glyph disc is white with the glyph in the accent, and carries no initials', async ({
  mount,
  page,
}) => {
  const frame = await mount(<GlyphGroupOnTint discs={1} />);
  const disc = frame.locator('.hg-avatar--glyph');
  await expect(disc).toHaveCount(1);
  await expect(disc).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(disc).toHaveCSS('color', await resolvedColour(page, '--accent'));
  await expect(disc.locator('svg')).toHaveCount(1);
  await expect(disc).toHaveText('');
});

test('the group’s ring takes the tinted ground, and four discs show before its own +N', async ({
  mount,
  page,
}) => {
  const frame = await mount(<GlyphGroupOnTint discs={6} />);
  const tint = await resolvedColour(page, '--accent-subtle');
  const items = frame.locator('.hg-avatar-group-item');
  await expect(items).toHaveCount(4);
  for (const index of [0, 1, 2, 3]) {
    await expect(items.nth(index)).toHaveCSS('box-shadow', `${tint} 0px 0px 0px 2px`);
  }
  const overflow = frame.locator('.hg-avatar-overflow');
  await expect(overflow).toHaveText('+2');
  await expect(overflow).toHaveCSS('box-shadow', `${tint} 0px 0px 0px 2px`);
});
