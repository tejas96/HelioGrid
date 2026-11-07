import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Pressable } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';

const tryAgain = (await createTranslator('en')).t(SIGN_IN.tryAgain);

/** A press at the target's centre, by the given kind of pointer. */
function pressWith(target: Locator, pointerType: 'mouse' | 'touch'): Promise<void> {
  return target.evaluate((element: Element, kind: string) => {
    const box = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerType: kind,
        bubbles: true,
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
      }),
    );
  }, pointerType);
}

test('a touch leaves an ink clipped to the target, which then goes; a mouse leaves none', async ({
  mount,
}) => {
  const target = await mount(
    <Pressable accessibilityLabel={tryAgain} style={{ width: 160, borderRadius: 999 }} />,
  );
  await pressWith(target, 'mouse');
  // Read at once: an ink removes itself, so a waiting check would pass on one that was drawn.
  expect(await target.locator('.hg-pressable-ink').count()).toBe(0);

  await pressWith(target, 'touch');
  await expect(target.locator('.hg-pressable-ink')).toHaveCount(1);
  const clip = target.locator('.hg-pressable-ink-clip');
  await expect(clip).toHaveCSS('overflow', 'hidden');
  await expect(clip).toHaveCSS('border-top-left-radius', '999px');
  await expect(target).toHaveCSS('position', 'relative');

  await expect(target.locator('.hg-pressable-ink')).toHaveCount(0, { timeout: 2000 });
  await expect(target).not.toHaveAttribute('data-inking');
});

test('a target that draws its own pressed look, or a person who reduces motion, gets no ink', async ({
  mount,
  page,
}) => {
  const own = await mount(<Pressable accessibilityLabel={tryAgain} ripple="none" />);
  await pressWith(own, 'touch');
  expect(await own.locator('.hg-pressable-ink').count()).toBe(0);
  await own.unmount();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const calm = await mount(<Pressable accessibilityLabel={tryAgain} />);
  await pressWith(calm, 'touch');
  expect(await calm.locator('.hg-pressable-ink').count()).toBe(0);
});
