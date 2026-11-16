import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { ShellGlyph } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');
const word = en.t(COMPANY_SIGNUP.city);

/**
 * Every icon in `@heliogrid/ui` is a named Lucide shape drawn by `ShellGlyph` (`F7-19`): the size
 * is a step of the ladder, the stroke is Lucide's 2 at every size, and the two shapes Lucide lacks
 * are drawn in its style.
 */
test('a glyph draws on the ladder at the one stroke, Lucide or drawn here', async ({ mount }) => {
  const screen = await mount(
    <div>
      <span data-glyph="dense">
        <ShellGlyph name="check" size="dense" />
      </span>
      <span data-glyph="md">
        <ShellGlyph name="alert-circle" size="md" />
      </span>
      <span data-glyph="custom">
        <ShellGlyph name="inverter" />
      </span>
    </div>,
  );

  const dense = screen.locator('[data-glyph="dense"] svg');
  await expect(dense).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(dense).toHaveAttribute('width', '14');
  await expect(dense).toHaveAttribute('stroke-width', '2');
  await expect(dense).toHaveAttribute('aria-hidden', 'true');

  const md = screen.locator('[data-glyph="md"] svg');
  await expect(md).toHaveAttribute('width', '20');
  await expect(md).toHaveAttribute('stroke-width', '2');
  await expect(md.locator('circle')).toHaveCount(1);

  const custom = screen.locator('[data-glyph="custom"] svg');
  await expect(custom).toHaveAttribute('width', '24');
  await expect(custom).toHaveAttribute('stroke-width', '2');
  await expect(custom).toHaveAttribute('stroke-linecap', 'round');
  await expect(custom.locator('rect')).toHaveCount(1);
});

test('a glyph takes its holder’s colour, fills in its ink, and speaks only when labelled', async ({
  mount,
}) => {
  const screen = await mount(
    <div style={{ color: 'var(--danger-text)' }}>
      <span data-glyph="current">
        <ShellGlyph name="star" tone="current" fill="ink" />
      </span>
      <span data-glyph="labelled">
        <ShellGlyph name="check" tone="current" label={word} />
      </span>
    </div>,
  );

  const current = screen.locator('[data-glyph="current"] svg');
  const holder = await screen.evaluate((node) => getComputedStyle(node).color);
  await expect(current).toHaveCSS('color', holder);
  await expect(current).toHaveAttribute('fill', 'currentColor');

  const labelled = screen.locator('[data-glyph="labelled"] svg');
  await expect(labelled).toHaveAttribute('role', 'img');
  await expect(labelled).toHaveAttribute('aria-label', word);
  await expect(labelled).not.toHaveAttribute('aria-hidden', 'true');
});
