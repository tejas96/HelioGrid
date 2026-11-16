import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { drawsModalMark, MODAL_TONE_GLYPH } from './Modal.logic';
import type { ModalTone } from './Modal.types';

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
    <View style={[styles.mark, { backgroundColor: paint.tint }]}>
      {icon ?? (glyph === null ? null : <ShellGlyph name={glyph} size="md" ink={paint.ink} />)}
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
