import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { AccountTile } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

/** The link step's tile (`SCR-M01-01`): "Signing in with Google" over the account, at the phone's 375. */
const overline = (await createTranslator('en')).t(SIGN_IN.signingInWithGoogle);
const WIDTH = 375;

for (const account of [
  'priya.sharma@gmail.com',
  'priya.sharma.suryodaya.solar.epc.operations.team.lead@gmail.com',
]) {
  test(`the tile is filled, rounded and padded, and ${account.length} characters stay inside it`, async ({
    mount,
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const column = await mount(
      <div style={{ width: WIDTH }}>
        <AccountTile overline={overline} account={account} />
      </div>,
    );
    await expect(column.getByText(overline, { exact: true })).toBeVisible();
    const line = column.getByText(account, { exact: true });
    await expect(line).toBeVisible();

    const look = await line.evaluate((element) => {
      const tile = element.closest('.hg-account-tile') as HTMLElement;
      const box = tile.getBoundingClientRect();
      // The words' own extent, not the element's: a block keeps its width while its text spills.
      const range = document.createRange();
      range.selectNodeContents(element);
      const ink = range.getBoundingClientRect();
      const style = getComputedStyle(tile);
      const probe = document.createElement('div');
      probe.style.padding = 'var(--tile-pad)';
      probe.style.borderRadius = 'var(--r-tile)';
      document.body.append(probe);
      const expected = getComputedStyle(probe);
      const want = { padding: expected.paddingTop, radius: expected.borderTopLeftRadius };
      probe.remove();
      return {
        fill: style.backgroundColor,
        padding: style.paddingTop,
        radius: style.borderTopLeftRadius,
        want,
        tileWidth: box.width,
        inkRight: ink.right,
        tileInnerRight: box.right - Number.parseFloat(style.paddingRight),
      };
    });
    expect(look.fill).toBe(await resolvedColour(page, '--fill'));
    expect(look.padding).toBe(look.want.padding);
    expect(look.radius).toBe(look.want.radius);
    expect(look.tileWidth).toBe(WIDTH);
    expect(look.inkRight).toBeLessThanOrEqual(look.tileInnerRight + 0.5);
    expect(errors).toEqual([]);
  });
}
