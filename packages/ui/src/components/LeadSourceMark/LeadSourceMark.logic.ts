import { LEAD_SOURCES, type LeadSource } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/AppShell.types';

const SOURCE_GLYPH: Record<LeadSource, ShellGlyphName> = {
  quick_add: 'bolt',
  import: 'upload',
  referral: 'link',
};

function isKnownSource(source: string): source is LeadSource {
  return LEAD_SOURCES.some((known) => known === source);
}

/** The source's glyph; a source this build does not know draws the plain dot. */
export function sourceGlyphOf(source: string): ShellGlyphName {
  return isKnownSource(source) ? SOURCE_GLYPH[source] : 'dot';
}
