import { ShellGlyph } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

/**
 * Every icon in `@heliogrid/ui` is a named shape drawn through `ShellGlyphMarks` (`F7-19`): a
 * glyph's box sets the size and the stroke, and its marks are the shape's paths, circles and
 * rounded rectangles — each kind drawn, none dropped.
 */
test('a glyph draws each kind of mark its shape holds, inside the box its size sets', async ({
  mount,
}) => {
  const screen = await mount(
    <div>
      <span data-glyph="pause">
        <ShellGlyph name="pause" size="sm" />
      </span>
      <span data-glyph="alert-circle">
        <ShellGlyph name="alert-circle" size="md" />
      </span>
      <span data-glyph="close">
        <ShellGlyph name="close" />
      </span>
    </div>,
  );

  const pause = screen.locator('[data-glyph="pause"] svg');
  await expect(pause).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(pause).toHaveAttribute('width', '16');
  await expect(pause).toHaveAttribute('stroke-width', '1.8');
  await expect(pause.locator('rect')).toHaveCount(2);
  await expect(pause.locator('path, circle')).toHaveCount(0);

  const alert = screen.locator('[data-glyph="alert-circle"] svg');
  await expect(alert).toHaveAttribute('width', '20');
  await expect(alert).toHaveAttribute('stroke-width', '1.5');
  await expect(alert.locator('circle')).toHaveCount(1);
  await expect(alert.locator('path')).toHaveCount(1);

  const close = screen.locator('[data-glyph="close"] svg');
  await expect(close).toHaveAttribute('width', '24');
  await expect(close.locator('path')).toHaveCount(1);
  await expect(close.locator('circle, rect')).toHaveCount(0);
});

test('the filled form replaces the outline and fills in the current colour', async ({ mount }) => {
  const screen = await mount(
    <div>
      <span data-glyph="outline">
        <ShellGlyph name="people" />
      </span>
      <span data-glyph="filled">
        <ShellGlyph name="people" filled />
      </span>
    </div>,
  );

  const outline = screen.locator('[data-glyph="outline"] svg');
  await expect(outline).toHaveAttribute('fill', 'none');
  await expect(outline.locator('path')).toHaveCount(4);

  const filled = screen.locator('[data-glyph="filled"] svg');
  await expect(filled).toHaveAttribute('fill', 'currentColor');
  await expect(filled.locator('circle')).toHaveCount(1);
  await expect(filled.locator('path')).toHaveCount(1);
});
