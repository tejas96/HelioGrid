import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';

/** The tick a checked box draws, in the ink it is given — `Checkbox`'s, and a multi-select card's. */
export function CheckboxTick({ ink }: { ink: string }) {
  return (
    <Svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ink}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name="tick-small" />
    </Svg>
  );
}
