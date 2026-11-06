import { ActivityIndicator } from 'react-native';
import Svg from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';

/** A refused capture surface draws its glyph in the danger tone, as the web half's stylesheet does. */
interface GlyphProps {
  refused?: boolean;
}

function strokeOf(refused: boolean | undefined): ThemeColor {
  return colors[refused ? 'danger-text' : 'text-tertiary'];
}

export function CameraGlyph({ refused }: GlyphProps) {
  const stroke = strokeOf(refused);
  return (
    <Svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name="camera" />
    </Svg>
  );
}

export function FileGlyph({ refused }: GlyphProps) {
  const stroke = strokeOf(refused);
  return (
    <Svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ShellGlyphMarks name="file" />
    </Svg>
  );
}

/** The upload's progress channel — beside the label, never in place of it. */
export function DropzoneSpinner() {
  return <ActivityIndicator color={colors.accent} size="small" />;
}
