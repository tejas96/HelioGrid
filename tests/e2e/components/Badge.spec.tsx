import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Badge } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { CATEGORY_HUES } from '../support/hues';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const words = en.t(SIGN_IN.tryAgain);

for (const hue of CATEGORY_HUES) {
  test(`the ${hue} category badge draws its hue's wash and words, the pair the theme measures`, async ({
    mount,
    page,
  }) => {
    const badge = await mount(<Badge tone={hue}>{words}</Badge>);
    const drawn = await badge.evaluate((node) => {
      const style = getComputedStyle(node);
      return { fg: style.color, bg: style.backgroundColor };
    });
    expect(drawn.bg).toBe(await resolvedColour(page, `--hue-${hue}-bg`));
    expect(drawn.fg).toBe(await resolvedColour(page, `--hue-${hue}-text`));
  });
}
