import { createTranslator, destinationLabel, verbLabel } from '@heliogrid/i18n';
import { BottomNav, type BottomNavItem, ShellGlyph } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedLength } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

/**
 * The phone footer (`F7-22`, the design system's open-page `BottomNav`): one white pill on the
 * footer tokens, separated by its shadow and never a line (`F7-15`); the verb runs its act and is
 * never the item in view.
 */
const en = await createTranslator('en');
const destination = (key: 'home' | 'leads' | 'proposals' | 'more'): BottomNavItem => ({
  key,
  label: destinationLabel(en.t, key),
  icon: <ShellGlyph name="house" />,
});

test('the pill floats on the footer tokens, with no border and the e4 shadow', async ({
  mount,
  page,
}) => {
  const screen = await mount(
    <div style={{ position: 'relative', height: 600 }}>
      <BottomNav items={[destination('home'), destination('more')]} value="home" />
    </div>,
  );
  const pill = screen.getByRole('navigation');
  const frame = await screen.boundingBox();
  const box = await pill.boundingBox();

  expect(box?.height).toBe(await resolvedLength(page, '--bottomnav-pill-h'));
  expect((box?.x ?? 0) - (frame?.x ?? 0)).toBe(await resolvedLength(page, '--bottomnav-inset'));
  const frameBottom = (frame?.y ?? 0) + (frame?.height ?? 0);
  expect(frameBottom - ((box?.y ?? 0) + (box?.height ?? 0))).toBe(
    await resolvedLength(page, '--bottomnav-gap'),
  );
  await expect(pill).toHaveCSS('border-top-width', '0px');
  const e4 = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.boxShadow = 'var(--e4)';
    document.body.append(probe);
    const value = getComputedStyle(probe).boxShadow;
    probe.remove();
    return value;
  });
  await expect(pill).toHaveCSS('box-shadow', e4);
});

test('the verb runs its act, never becomes the item in view, and every slot clears the touch floor', async ({
  mount,
}) => {
  const acts: string[] = [];
  const verb: BottomNavItem = {
    key: 'action',
    verb: true,
    label: verbLabel(en.t, 'add_lead'),
    icon: <ShellGlyph name="plus-circle" />,
    onClick: () => {
      acts.push('add_lead');
    },
  };
  const items = [destination('home'), destination('leads'), verb, destination('proposals')];
  const changes: string[] = [];
  const screen = await mount(
    <div style={{ position: 'relative', height: 600 }}>
      <BottomNav items={items} value="action" onChange={(key) => changes.push(key)} />
    </div>,
  );
  const action = screen.getByRole('button', { name: verbLabel(en.t, 'add_lead') });

  await expect(action).not.toHaveAttribute('aria-current');
  await action.click();
  await expect.poll(() => acts).toEqual(['add_lead']);
  expect(changes).toEqual([]);

  for (const item of await screen.getByRole('button').all()) {
    const slot = await item.boundingBox();
    expect(slot?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(slot?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }
});
