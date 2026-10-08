import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Transcript } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const agentSaid = en.t(SIGN_IN.wrongError);
const customerSaid = en.t(SIGN_IN.googleFailedBody);

const turns = [
  { id: 1, party: 'agent' as const, text: agentSaid, at: 0 },
  { id: 2, party: 'customer' as const, text: customerSaid, at: 5 },
];

test("the agent's turn is a tile under the agent's name", async ({ mount, page }) => {
  const transcript = await mount(<Transcript turns={turns} />);
  const turn = transcript.locator('.hg-transcript-bubble').filter({ hasText: agentSaid });

  await expect(turn.locator('.hg-transcript-speaker')).toHaveAttribute('data-party', 'agent');
  await expect(turn).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(turn).toHaveCSS('box-shadow', 'none');
});

test('the turn being played keeps its accent tint', async ({ mount, page }) => {
  const transcript = await mount(<Transcript turns={turns} currentAt={0} />);
  const turn = transcript.locator('.hg-transcript-bubble').filter({ hasText: agentSaid });

  await expect(turn).toHaveCSS('background-color', await resolvedColour(page, '--accent-subtle'));
});
