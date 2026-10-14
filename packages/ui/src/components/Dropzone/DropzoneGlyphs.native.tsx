import { theme } from '@heliogrid/theme';
import { ActivityIndicator } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** A refused capture surface draws its glyph in the danger tone, as the web half's stylesheet does. */
interface GlyphProps {
  refused?: boolean;
}

function strokeOf(refused: boolean | undefined): string {
  return theme.colors[refused ? 'danger-text' : 'text-tertiary'];
}

export function CameraGlyph({ refused }: GlyphProps) {
  const stroke = strokeOf(refused);
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.5} stroke={stroke} strokeWidth={1.5} />
    </Svg>
  );
}

export function FileGlyph({ refused }: GlyphProps) {
  const stroke = strokeOf(refused);
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M14 3v5h5" stroke={stroke} strokeWidth={1.5} />
    </Svg>
  );
}

/** The upload's progress channel — beside the label, never in place of it. */
export function DropzoneSpinner() {
  return <ActivityIndicator color={theme.colors.accent} size="small" />;
}
