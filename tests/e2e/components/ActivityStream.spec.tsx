import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { ActivityStream, Card } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('the sticky day heading paints the ground that holds it', async ({ mount, page }) => {
  const card = await mount(
    <Card>
      <ActivityStream
        entries={[{ id: 1, kind: 'note', at: Date.now(), actorClass: 'person', summary: tryAgain }]}
        todayLabel={tryAgain}
        groupBy="day"
      />
    </Card>,
  );
  const day = card.locator('.hg-stream-day');

  await expect(day).toHaveCSS('position', 'sticky');
  await expect(day).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
});
