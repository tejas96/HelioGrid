import type { Page } from '@playwright/test';

/**
 * A theme colour token as the page resolves it, so a spec compares against `packages/theme` and
 * never types a colour. A token the page does not define fails here — an unresolved token and an
 * unpainted control are both transparent, and would otherwise read as equal.
 */
export async function resolvedColour(page: Page, token: `--${string}`): Promise<string> {
  const colour = await page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
  if (colour === 'rgba(0, 0, 0, 0)') throw new Error(`${token} resolves to nothing on this page`);
  return colour;
}
