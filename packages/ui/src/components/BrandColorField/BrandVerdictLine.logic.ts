import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type { BrandVerdictKind } from './BrandColorField.types';

/** The glyph each verdict draws, the same on both halves. */
export const VERDICT_GLYPH: Record<BrandVerdictKind, ShellGlyphName> = {
  pass: 'tick-long',
  warn: 'alert-triangle',
  info: 'info-ring',
};
