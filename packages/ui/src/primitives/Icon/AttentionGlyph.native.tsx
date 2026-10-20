import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../../components/AppShell/ShellGlyphMarks.native';
import type { AttentionGlyphProps } from './AttentionGlyph.types';

/**
 * The attention mark — an upright stroke over a dot. `Icon` sets its size and colour by cloning
 * it, so the props it passes land on the `Svg`.
 */
export function AttentionGlyph(props: AttentionGlyphProps) {
  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ShellGlyphMarks name="attention" />
    </Svg>
  );
}
