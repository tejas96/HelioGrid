import type { DesignStatus } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';

/** Each status's own mark; a status domain adds fails to compile here until it has one. */
const DESIGN_STATUS_GLYPH: Record<DesignStatus, ShellGlyphName> = {
  draft: 'pencil',
};

/** A status's own mark; one this build does not know keeps its tone's tint alone. */
export function designStatusGlyph(status: string): ShellGlyphName | null {
  return (DESIGN_STATUS_GLYPH as Record<string, ShellGlyphName | undefined>)[status] ?? null;
}
