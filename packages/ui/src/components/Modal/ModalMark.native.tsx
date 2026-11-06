import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { drawsModalMark, MODAL_TONE_GLYPH } from './Modal.logic';
import type { ModalTone } from './Modal.types';

interface TonePaint {
  bg: ThemeColor;
  fg: ThemeColor;
}

/** The semantic `-text` on `-bg` partner pairs — the same ones StatusMark resolves. */
const TONE: Record<ModalTone, TonePaint> = {
  neutral: { bg: colors['neutral-bg'], fg: colors['text-secondary'] },
  danger: { bg: colors['danger-bg'], fg: colors['danger-text'] },
  warning: { bg: colors['warning-bg'], fg: colors['warning-text'] },
  success: { bg: colors['success-bg'], fg: colors['success-text'] },
};

interface ModalMarkProps {
  icon?: ReactNode;
  tone: ModalTone;
}

/**
 * The leading circular icon tint. `neutral` draws nothing unless the caller hands an `icon` — a
 * decision with no weight to it gets no mark at all. The tint carries the weight; the primary
 * button stays near-black unless the action is genuinely destructive.
 */
export function ModalMark({ icon, tone }: ModalMarkProps) {
  const paint = TONE[tone];
  const glyph = MODAL_TONE_GLYPH[tone];
  if (!drawsModalMark(icon, tone)) {
    return null;
  }
  return (
    <View style={[styles.mark, { backgroundColor: paint.bg }]}>
      {icon ??
        (glyph === null ? null : (
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke={paint.fg}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ShellGlyphMarks name={glyph} />
          </Svg>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 44,
    height: 44,
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
