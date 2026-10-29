import { HOME_LADDER } from '@heliogrid/domain';
import { BLOCK, createTranslator, homeBlocksWords } from '@heliogrid/i18n';
import { HomeBlocks } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectSharedEdge, settledBox } from '../support/layout';

const en = await createTranslator('en');
const [OWNER, MANAGER] = HOME_LADDER;
const words = {
  ...homeBlocksWords(en.t, { home: OWNER, composed: [MANAGER] }),
  loadingLabel: en.t(BLOCK.loading),
};

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('a loaded home teaches in every block, side by side', async ({ mount, page }) => {
    const region = await mount(<HomeBlocks {...words} read={{ kind: 'ready', value: null }} />);
    const teaching = region.getByText(words.emptyTitle);

    await expect(teaching).toHaveCount(2);
    const [own, composed] = [await settledBox(teaching.nth(0)), await settledBox(teaching.nth(1))];
    expect(composed?.x).toBeGreaterThan((own?.x ?? 0) + (own?.width ?? 0));
    await expectSharedEdge([teaching.nth(0), teaching.nth(1)], 'top');
    await expectNoSidewaysScroll(page);
  });
});

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the blocks stack, the composed one under the own', async ({ mount }) => {
    const region = await mount(<HomeBlocks {...words} read={{ kind: 'ready', value: null }} />);
    const teaching = region.getByText(words.emptyTitle);

    const [own, composed] = [await settledBox(teaching.nth(0)), await settledBox(teaching.nth(1))];
    expect(composed?.y).toBeGreaterThan(own?.y ?? 0);
  });
});

test('a failed load offers the retry in each block', async ({ mount }) => {
  let retries = 0;
  const region = await mount(
    <HomeBlocks
      {...words}
      read={{
        kind: 'failed',
        failure: 'no_connection',
        retry: () => {
          retries += 1;
        },
      }}
    />,
  );

  await expect(region.getByText(words.errorTitle)).toHaveCount(2);
  await region.getByRole('button', { name: words.retryLabel }).first().click();
  await expect.poll(() => retries).toBe(1);
});
