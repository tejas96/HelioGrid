/**
 * The door's living sky (`SCR-M01-01` and every door after it): a rooftop solar system under the
 * sun's path. Panels land on the roof one by one, the sun rises along its arc into the place it
 * holds at this hour on the device, the cells catch its light and energy runs to the home and the
 * grid; after sunset a moon, the stars and lit windows take over. It is art and carries no
 * information, so it is hidden from screen readers.
 *
 * `door` — the front door's tall sky; `band` — the shorter sky above a setup step.
 */
export type SkyFraming = 'door' | 'band';

export interface SolarSkyProps {
  framing: SkyFraming;
  /** The hour to draw, 0–24. Absent, the device's own clock is read once when the sky appears. */
  hours?: number;
}
