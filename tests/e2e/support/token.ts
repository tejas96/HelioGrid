import type { Locator, Page } from '@playwright/test';

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

/**
 * A box-shadow written in theme tokens, as the page resolves it — a ring, or a ring over a lift, is
 * compared against the component's own rule and never typed as a colour. One that does not resolve
 * fails here, as `resolvedShadow` does.
 */
export async function resolvedBoxShadow(page: Page, written: string): Promise<string> {
  const shadow = await page.evaluate((value) => {
    const probe = document.createElement('div');
    probe.style.boxShadow = value;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).boxShadow;
    probe.remove();
    return resolved;
  }, written);
  if (shadow === 'none') throw new Error(`${written} resolves to nothing on this page`);
  return shadow;
}

/**
 * The colour a box paints, as the page computes it — so a part that must paint the ground holding
 * it (a sticky head over rows scrolling under it) is compared with its holder, whatever that is.
 */
export function fillOf(holder: Locator): Promise<string> {
  return holder.evaluate((node) => getComputedStyle(node).backgroundColor);
}

/** A tile (`packages/ui/src/primitives/Ground/Ground.css`): glass — a light on its top edge, ringed in `--line-soft`, over `--e2`. */
export const TILE_SHADOW = 'inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-soft), var(--e2)';

/** A tile's fill (`primitives/Ground/Ground.css`'s tiles list): the card colour frosted — glass. */
export const TILE_FILL = '--glass';

/** The resting edge a field and a secondary button draw inside themselves: a `--line-strong` hairline. */
export const STRONG_EDGE = 'inset 0 0 0 1px var(--line-strong)';

/** A focused field (`packages/ui/src/primitives/FieldBox/FieldBox.css`): the inset accent edge and its soft glow. */
export const FOCUS_RING =
  'inset 0 0 0 2px var(--accent), 0 0 0 4px color-mix(in srgb, var(--accent) 16%, transparent)';

/**
 * A theme font token (`--font-*`, `--fw-*`) as the page resolves it — so a spec reads a face or a
 * weight, never types one.
 */
export async function resolvedFont(
  page: Page,
  property: 'fontFamily' | 'fontWeight',
  token: `--${string}`,
): Promise<string> {
  return page.evaluate(
    ([prop, name]) => {
      const probe = document.createElement('div');
      probe.style[prop] = `var(${name})`;
      document.body.append(probe);
      const value = getComputedStyle(probe)[prop];
      probe.remove();
      return value;
    },
    [property, token] as const,
  );
}
