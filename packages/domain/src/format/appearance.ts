/**
 * The appearance a person picks in Profile & preferences. `device` follows the system setting.
 * Kept on the device, never on the account: a phone and a laptop may differ.
 */
export const APPEARANCES = ['device', 'light', 'dark'] as const;
export type Appearance = (typeof APPEARANCES)[number];

export function appearanceOf(value: string | null | undefined): Appearance | null {
  return (APPEARANCES as readonly (string | null | undefined)[]).includes(value)
    ? (value as Appearance)
    : null;
}
