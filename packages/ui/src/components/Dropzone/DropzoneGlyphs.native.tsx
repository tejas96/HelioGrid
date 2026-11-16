import { ActivityIndicator } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';

/** A refused capture surface draws its glyph in the danger tone, as the web half's stylesheet does. */
interface GlyphProps {
  refused?: boolean;
}

function strokeOf(refused: boolean | undefined): ThemeColor {
  return colors[refused ? 'danger-text' : 'text-tertiary'];
}

export function CameraGlyph({ refused }: GlyphProps) {
  const stroke = strokeOf(refused);
  return <ShellGlyph name="camera" size="xl" ink={stroke} />;
}

export function FileGlyph({ refused }: GlyphProps) {
  const stroke = strokeOf(refused);
  return <ShellGlyph name="file" size="lg" ink={stroke} />;
}

/** The upload's progress channel — beside the label, never in place of it. */
export function DropzoneSpinner() {
  return <ActivityIndicator color={colors.accent} size="small" />;
}
