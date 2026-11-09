import type { AmbientStrength, LightField } from './AmbientSky.types';

/** Where each field of light rests and drifts, per strength. */
const DOOR: readonly LightField[] = [
  { hue: 'teal', x: 0.78, y: 0.12, size: 1.1, drift: [-0.06, 0.04], opacity: 0.34 },
  { hue: 'green', x: 0.36, y: 0.04, size: 0.9, drift: [0.07, 0.03], opacity: 0.26 },
  { hue: 'blue', x: 0.06, y: 0.3, size: 0.95, drift: [0.05, -0.04], opacity: 0.22 },
  { hue: 'ocean', x: 0.62, y: 0.62, size: 1.2, drift: [-0.05, -0.05], opacity: 0.16 },
];

const PAGE: readonly LightField[] = [
  { hue: 'teal', x: 0.88, y: -0.12, size: 0.9, drift: [-0.04, 0.02], opacity: 0.14 },
  { hue: 'green', x: 0.52, y: -0.18, size: 0.8, drift: [0.05, 0.02], opacity: 0.11 },
  { hue: 'blue', x: 0.08, y: -0.14, size: 0.75, drift: [0.03, 0.02], opacity: 0.09 },
];

export const LIGHT_FIELDS: Readonly<Record<AmbientStrength, readonly LightField[]>> = {
  door: DOOR,
  page: PAGE,
};

/** The phone draws the dark canvas's light stronger, as the page glow does. */
export const DARK_LIFT = 1.35;
