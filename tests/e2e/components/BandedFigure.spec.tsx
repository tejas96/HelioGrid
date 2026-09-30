import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { BandedFigure, Button } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

for (const variant of ['card', 'box'] as const) {
  test(`a banded figure's ${variant} is a grey tile with no shadow and its controls are white`, async ({
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

    await expect(figure).toHaveCSS(
      'background-color',
      await resolvedColour(page, '--canvas-sunken'),
    );
    await expect(figure).toHaveCSS('box-shadow', 'none');
    await expect(figure.getByRole('button', { name: tryAgain })).toHaveCSS(
      'background-color',
      await resolvedColour(page, '--surface'),
    );
  });
}
