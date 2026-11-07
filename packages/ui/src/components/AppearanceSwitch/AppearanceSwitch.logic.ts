import { APPEARANCES, type Appearance } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { AppearanceWords } from './AppearanceSwitch.types';

/** Each choice's icon: the device's own screen, the sun, the moon. */
export const APPEARANCE_GLYPH: Readonly<Record<Appearance, ShellGlyphName>> = {
  device: 'monitor',
  light: 'sun',
  dark: 'moon',
};

/** The three choices, in the order the switch draws them, each with its word and icon. */
export function appearanceOptions(words: AppearanceWords) {
  return APPEARANCES.map((value) => ({
    value,
    label: words.options[value],
    glyph: APPEARANCE_GLYPH[value],
  }));
}
