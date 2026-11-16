import type { ThemeColor } from '../../primitives/Color/colors';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';

/** The tick a checked box draws, in the ink it is given — `Checkbox`'s, and a multi-select card's. */
export function CheckboxTick({ ink }: { ink: ThemeColor }) {
  return <ShellGlyph name="check" size="dense" ink={ink} />;
}
