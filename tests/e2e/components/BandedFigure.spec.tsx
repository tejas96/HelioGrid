import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { BandedFigure, Button } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedBoxShadow, resolvedColour, TILE_FILL, TILE_SHADOW } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

for (const variant of ['card', 'box'] as const) {
  test(`a banded figure's ${variant} is a tile and its controls are white`, async ({
    mount,
    page,
  }) => {
    const figure = await mount(
      <BandedFigure label={tryAgain} value={12} variant={variant}>
        <Button variant="secondary" size="sm">
          {tryAgain}
        </Button>
      </BandedFigure>,
    );

    await expect(figure).toHaveCSS('background-color', await resolvedColour(page, TILE_FILL));
    await expect(figure).toHaveCSS('box-shadow', await resolvedBoxShadow(page, TILE_SHADOW));
    await expect(figure.getByRole('button', { name: tryAgain })).toHaveCSS(
      'background-color',
      await resolvedColour(page, '--surface'),
    );
  });
}
