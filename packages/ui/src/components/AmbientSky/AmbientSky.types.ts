/**
 * The one loop allowed to run on (`.claude/rules/ui-adherence.md`, *Motion*): slow light in the
 * logo's colours drifting behind a door or along a page's top glow. It is atmosphere and never
 * carries information; it pauses off-screen and in the background, stops under reduced motion and
 * is gone in field mode.
 *
 * `door` — the full sky of a door: four large fields of light, the strongest. `page` — the quiet
 * glow along the top of a page inside the app.
 */
export type AmbientStrength = 'door' | 'page';

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
