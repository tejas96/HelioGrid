import { PRINT_READY_ATTRIBUTE, PRINT_REFUSED_ATTRIBUTE } from '@heliogrid/contracts/workflows';
import { expect, test } from '@playwright/test';
import { expectNoSidewaysScroll } from '../support/layout';

/** A version nobody generated, and a grant nobody signed. */
const NO_VERSION = '01a30000-0000-7000-8000-00000000aaaa';
const NO_GRANT = 'not-a-grant-anyone-signed';

/*
 * `T-M06-017`, `F5-39`: the printer's page draws a version only behind a grant that holds. Without
 * one it draws nothing, never tells the renderer it is ready, and tells it at once that the grant
 * was refused — so the render fails now and no PDF is ever made of an empty page. The printed
 * document itself is proven on the running stack, where the worker opens this page (`qa-live`).
 */
test('a print page without a grant that holds draws nothing and says at once it was refused', async ({
  page,
}) => {
  await page.goto(`/print/proposal/${NO_VERSION}?grant=${NO_GRANT}`);

  await expect(page.locator(`[${PRINT_REFUSED_ATTRIBUTE}]`)).toHaveCount(1, { timeout: 5_000 });
  await expect(page.locator(`[${PRINT_READY_ATTRIBUTE}]`)).toHaveCount(0);
  await expect(page.locator('[data-paper]')).toHaveCount(0);
  await expectNoSidewaysScroll(page);
});
