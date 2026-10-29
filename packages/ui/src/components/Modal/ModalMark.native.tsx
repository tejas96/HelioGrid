import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { drawsModalMark, MODAL_TONE_GLYPH } from './Modal.logic';
import type { ModalTone } from './Modal.types';

interface TonePaint {
  bg: string;
  fg: string;
}

/** The semantic `-text` on `-bg` partner pairs — the same ones StatusMark resolves. */
const TONE: Record<ModalTone, TonePaint> = {
  neutral: { bg: theme.colors['neutral-bg'], fg: theme.colors['text-secondary'] },
  danger: { bg: theme.colors['danger-bg'], fg: theme.colors['danger-text'] },
  warning: { bg: theme.colors['warning-bg'], fg: theme.colors['warning-text'] },
  success: { bg: theme.colors['success-bg'], fg: theme.colors['success-text'] },
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
