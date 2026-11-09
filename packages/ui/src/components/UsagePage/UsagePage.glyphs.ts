import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { UsageRowKey } from './UsagePage.types';

/** The glyph beside each row's label in its tile, the same on both halves. */
export const USAGE_ROW_GLYPH: Record<UsageRowKey, ShellGlyphName> = {
  proposals: 'file-text',
  projects: 'kanban',
  design: 'solar-panel',
  voice: 'headset',
  storage: 'layers',
  otp: 'phone',
};

/** A figure's runs as one string, for a tile that draws it in the display face. */
export function figureText(value: readonly { readonly text: string }[]): string {
  return value.map((run) => run.text).join('');
}
