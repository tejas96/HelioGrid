import { SourceDocument } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

test("a document's frame is on the page and its reading area is the sunken desk", async ({
  mount,
  page,
}) => {
  const viewer = await mount(<SourceDocument />);

  await expect(viewer).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(viewer).toHaveCSS('box-shadow', 'none');
  await expect(viewer).toHaveCSS('border-radius', '0px');
  await expect(viewer.locator('.hg-source-doc-body')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--canvas-sunken'),
  );
});

test("a document's state mark is a glyph on its panel — no disc, no shadow", async ({ mount }) => {
  const viewer = await mount(<SourceDocument />);
  const mark = viewer.locator('.hg-source-doc-message-mark');

  await expect(mark).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(mark).toHaveCSS('box-shadow', 'none');
});
