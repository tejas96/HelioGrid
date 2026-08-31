import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { AudioGlyph } from './AudioGlyph.native';
import { formatClock } from './AudioPlayer.types';

const type = theme.type.roles;

/** The web half's `.hg-audio-round:disabled { opacity: 0.45 }` (AudioTransport.css), in RN. */
const DISABLED_OPACITY = 0.45;

const styles = StyleSheet.create({
  round: { borderRadius: theme.radius['r-pill'], flexShrink: 0 },
  dimmed: { opacity: DISABLED_OPACITY },
  ghost: { width: 52, height: 52, backgroundColor: 'transparent' },
  primary: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors['action-primary'],
    ...theme.elevation.e2,
  },
  skip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  skipCount: {
    fontFamily: theme.type.families.mono,
    fontSize: type.caption.fontSize,
    fontWeight: '700',
    letterSpacing: -0.24,
    color: theme.colors['text-secondary'],
  },
  time: {
    flexShrink: 0,
    fontFamily: theme.type.families.mono,
    fontSize: type.caption.fontSize,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
  timeDim: { color: theme.colors['text-tertiary'] },
  scrub: { flex: 1, minWidth: 0, height: 44, justifyContent: 'center' },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: 4,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  fill: { position: 'absolute', left: 0, top: 20, height: 4, borderRadius: theme.radius['r-pill'] },
  thumb: {
    position: 'absolute',
    top: 13,
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    ...theme.elevation.e3,
  },
  speed: {
    height: 44,
    minWidth: 52,
    flexShrink: 0,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  speedChanged: { backgroundColor: theme.colors['accent-subtle'], shadowOpacity: 0, elevation: 0 },
  speedText: {
    fontFamily: theme.type.families.mono,
    fontSize: type['body-sm'].fontSize,
    fontWeight: '700',
    color: theme.colors['text-primary'],
  },
  speedTextChanged: { color: theme.colors.accent },
  door: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
  doorText: {
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
});

export function RoundButton({
  label,
  onPress,
  kind,
  disabled = false,
  children,
}: {
  label: string;
  onPress: () => void;
  kind: 'primary' | 'ghost';
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.round,
        kind === 'primary' ? styles.primary : styles.ghost,
        disabled ? styles.dimmed : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** ±10s back and +30s forward — a full sales call on a 375px phone is ~3 seconds per pixel. */
export function SkipButton({
  back,
  disabled = false,
  onSeek,
}: {
  back: boolean;
  disabled?: boolean;
  onSeek: (delta: number) => void;
}) {
  return (
    <RoundButton
      kind="ghost"
      disabled={disabled}
      label={back ? 'Back 10 seconds' : 'Forward 30 seconds'}
      onPress={() => onSeek(back ? -10 : 30)}
    >
      <View style={styles.skip}>
        <AudioGlyph name={back ? 'back' : 'fwd'} size={15} color={theme.colors['text-secondary']} />
        <Text style={styles.skipCount}>{back ? 10 : 30}</Text>
      </View>
    </RoundButton>
  );
}

export function TimeLabel({ seconds, dim }: { seconds: number; dim?: boolean }) {
  return (
    <Text style={[styles.time, dim === true ? styles.timeDim : null]}>{formatClock(seconds)}</Text>
  );
}

/**
 * The scrubber. The web half is a range input with keyboard seek; touch has no key events, so the
 * rail takes tap-to-jump and drag, and the ±5s steps arrive through the adjustable a11y actions.
 *
 * `disabled` is the web input's `disabled={!total}`, widened: with no length OR no seek handler
 * behind it there is nothing to aim at, so it takes no gesture, announces itself disabled and
 * draws no thumb rather than offering a control that cannot move.
 */
export function Scrubber({
  at,
  total,
  disabled = false,
  onSeek,
}: {
  at: number;
  total: number;
  disabled?: boolean;
  onSeek: (seconds: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const live = !disabled && total > 0;
  const ratio = total > 0 ? Math.min(1, Math.max(0, at / total)) : 0;
  const jump = (event: GestureResponderEvent) => {
    if (!live || width <= 0) return;
    onSeek((Math.min(width, Math.max(0, event.nativeEvent.locationX)) / width) * total);
  };
  const onAction = (event: AccessibilityActionEvent) => {
    if (!live) return;
    if (event.nativeEvent.actionName === 'increment') onSeek(at + 5);
    if (event.nativeEvent.actionName === 'decrement') onSeek(at - 5);
  };
  const fill: ViewStyle = {
    width: ratio * width,
    backgroundColor: live ? theme.colors.accent : theme.colors['text-disabled'],
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Seek within the recording"
      accessibilityState={{ disabled: !live }}
      accessibilityValue={{ text: `${formatClock(at)} of ${formatClock(total)}` }}
      accessibilityActions={live ? [{ name: 'increment' }, { name: 'decrement' }] : []}
      onAccessibilityAction={onAction}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => live}
      onMoveShouldSetResponder={() => live}
      onResponderGrant={jump}
      onResponderMove={jump}
      style={styles.scrub}
    >
      <View style={styles.rail} />
      <View style={[styles.fill, fill]} />
      {live ? <View style={[styles.thumb, { left: ratio * width }]} /> : null}
    </View>
  );
}

/** Speed cycles 1× → 1.25× → 1.5× → 2×. */
export function SpeedButton({
  rate,
  speeds,
  disabled = false,
  onChange,
}: {
  rate: number;
  speeds: number[];
  disabled?: boolean;
  onChange: (rate: number) => void;
}) {
  const next = () => {
    const value = speeds[(speeds.indexOf(rate) + 1) % speeds.length];
    if (value !== undefined) onChange(value);
  };
  const changed = rate !== 1;
  return (
    <Pressable
      accessibilityLabel={`Playback speed ${rate}×. Tap to change.`}
      disabled={disabled}
      onPress={next}
      style={[styles.speed, changed ? styles.speedChanged : null, disabled ? styles.dimmed : null]}
    >
      <Text style={[styles.speedText, changed ? styles.speedTextChanged : null]}>{`${rate}×`}</Text>
    </Pressable>
  );
}

/** The door to the transcript. It is offered in EVERY state, including error. */
export function TranscriptDoor({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.door}>
      <AudioGlyph name="doc" size={16} color={theme.colors['text-primary']} />
      <Text style={styles.doorText}>{label}</Text>
    </Pressable>
  );
}
