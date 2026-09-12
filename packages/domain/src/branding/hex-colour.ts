/**
 * The one shape a colour takes in this product — `#RRGGBB` — and the two directions through it.
 * The contract validates a brand colour against `HEX_COLOUR`; a field that takes typing goes
 * through `normaliseHexColour`, lenient on the way in (a missing `#`, `#RGB`, whitespace, either
 * case) and strict on the way out, or answers null. The maths takes the strict shape only.
 */

/** `#RGB` or `#RRGGBB`, either case — contracts validates against this same pattern. */
export const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A colour as its three channels, 0–255 each. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** `#RGB` or `#RRGGBB`, either case — the one shape the contract accepts. */
export function isHexColour(value: string): boolean {
  return HEX_COLOUR.test(value);
}

/** What typing becomes: trimmed, the `#` supplied, `#RGB` widened — or null when it is not a colour at all. */
export function parseHexColour(input: unknown): Rgb | null {
  if (typeof input !== 'string') return null;
  const digits = input.trim().replace(/^#/, '');
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/** The strict shape as channels; anything else is a defect upstream, so it throws. */
export function hexToRgb(hex: string): Rgb {
  const rgb = isHexColour(hex) ? parseHexColour(hex) : null;
  if (rgb === null) throw new RangeError(`a brand colour is #RRGGBB, not ${hex}`);
  return rgb;
}

/** Channels as `#RRGGBB`, each rounded and held to 0–255, so arithmetic on a colour never writes an invalid one. */
export function toHexColour({ r, g, b }: Rgb): string {
  const pair = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, '0');
  return `#${pair(r)}${pair(g)}${pair(b)}`.toUpperCase();
}

/** Any accepted spelling as `#RRGGBB`, or null. */
export function normaliseHexColour(input: unknown): string | null {
  const rgb = parseHexColour(input);
  return rgb === null ? null : toHexColour(rgb);
}
