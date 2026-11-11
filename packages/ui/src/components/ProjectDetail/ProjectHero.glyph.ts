import type { NextStep } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';

/** The glyph each next act carries (the picked design); a plain move carries none. */
export function nextGlyphOf(step: NextStep): ShellGlyphName | null {
  switch (step.kind) {
    case 'dispatch':
      return 'truck';
    case 'upload_missing':
    case 'upload_proof':
      return 'upload';
    case 'handover':
      return 'key';
    case 'install_date_passed':
      return 'calendar';
    case 'steps':
      return step.to === 'installation' ? null : 'camera';
    default:
      return null;
  }
}
