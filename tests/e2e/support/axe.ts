import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * `F7-26`: a missing accessible label fails the build. Only `serious` and `critical` fail —
 * `moderate` findings such as a page with no level-one heading stay with review — so raising
 * the bar is one line here, never a spec's own filter. Run it once the landing's words are
 * visible, never on a frame still animating in.
 */
export async function expectNoSeriousViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    );
  expect(serious).toEqual([]);
}
