import { createTranslator, provenanceWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { ProjectionAsDrawn } from './ProposalAfterSheets.story';

/**
 * A projection's label (`F8-23`, `T-FPLAT-074`): the tier, the word that calls the figure a
 * projection, and every assumption it rides on with its value — never the word alone.
 */
for (const reader of ['en', 'hi'] as const) {
  test(`in ${reader} a projection names its horizon and its yearly rise beside the tier`, async ({
    mount,
    page,
  }) => {
    const words = provenanceWords((await createTranslator(reader)).t);
    await page.setViewportSize({ width: 375, height: 300 });
    await mount(<ProjectionAsDrawn reader={reader} />);
    await expect(page.getByText(words.tier('estimated'))).toBeVisible();
    await expect(page.getByText(words.projection)).toBeVisible();
    await expect(page.getByText(words.assumption('horizonYears', '25'))).toBeVisible();
    await expect(page.getByText(words.assumption('escalationRate', '3'))).toBeVisible();
  });
}
