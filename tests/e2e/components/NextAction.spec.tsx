import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Button, RecordCard } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('a record card is a tile and its controls are white', async ({ mount, page }) => {
  const card = await mount(
    <RecordCard
      name={tryAgain}
      action={
        <Button variant="secondary" size="sm">
          {tryAgain}
        </Button>
      }
    />,
  );

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(card).toHaveCSS('box-shadow', 'none');
  await expect(card.getByRole('button', { name: tryAgain })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});

test('a tappable record card is ringed under the pointer, never lifted', async ({
  mount,
  page,
}) => {
  const card = await mount(<RecordCard name={tryAgain} onClick={() => undefined} />);

  await card.hover();
  await expect(card).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--mark-subtle')} 0px 0px 0px 2px`,
  );
  await expect(card).toHaveCSS('transform', 'none');
});
