import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Card } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { WordedActivityStream } from './ActivityStream.story';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('the sticky day heading paints the ground that holds it', async ({ mount, page }) => {
  const card = await mount(
    <Card>
      <WordedActivityStream
        read={{ kind: 'ready' }}
        entries={[{ id: 1, kind: 'note', at: Date.now(), actorClass: 'person', summary: tryAgain }]}
        todayLabel={tryAgain}
        groupBy="day"
      />
    </Card>,
  );
  const day = card.locator('.hg-stream-day');

  await expect(day).toHaveCSS('position', 'sticky');
  await expect(day).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
});
