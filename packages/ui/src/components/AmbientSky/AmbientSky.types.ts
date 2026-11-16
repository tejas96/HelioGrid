/**
 * The one loop allowed to run on (`.claude/rules/ui-adherence.md`, *Motion*): slow light in the
 * logo's colours drifting behind a door. It is atmosphere and never
 * carries information; it pauses off-screen and in the background, stops under reduced motion and
 * is gone in field mode.
 *
 * `door` — the full sky of a door: four large fields of light. A page's top glow is not this: it
 * is still, and has one owner per platform — the web's `body` (`--glow-page`, theme `base.css`),
 * the phone's `BrandBloom placement="page"`.
 */
export type AmbientStrength = 'door';

export interface AmbientSkyProps {
  strength: AmbientStrength;
}

/** One field of light: its colour, where it rests (fractions of the box), its size and how far it drifts. */
export interface LightField {
  readonly hue: 'green' | 'teal' | 'blue' | 'ocean';
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly drift: readonly [number, number];
  readonly opacity: number;
}
