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

/** A theme length token as the page resolves it, in px — so a spec measures against the token, never a typed number. */
export async function resolvedLength(page: Page, token: `--${string}`): Promise<number> {
  const px = await page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.height = `var(${name})`;
    document.body.append(probe);
    const value = probe.getBoundingClientRect().height;
    probe.remove();
    return value;
  }, token);
  if (px === 0) throw new Error(`${token} resolves to nothing on this page`);
  return px;
}

/** A theme shadow token as the page resolves it on a box — so a spec compares a shadow, never types one. */
export async function resolvedShadow(page: Page, token: `--${string}`): Promise<string> {
  const shadow = await page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.boxShadow = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).boxShadow;
    probe.remove();
    return value;
  }, token);
  if (shadow === 'none') throw new Error(`${token} resolves to nothing on this page`);
  return shadow;
}
