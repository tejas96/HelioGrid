import { theme } from '@heliogrid/tokens/theme';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * Six-box OTP entry driven by ONE hidden TextInput (the one-input pattern: auto-advance,
 * backspace walk-back and paste-distribution all fall out of single-string editing —
 * login.md §5 behaviors). Box visuals reuse the Input recipes: rest e1 → filled e2 →
 * focused accent ring → error 1.5dp inset danger ring on ALL boxes with digits retained.
 * Error is parent-owned: every edit fires onChange; the caller clears `error` there.
 */
export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessibility label for the hidden input — the boxes render no visible label. */
  label: string;
  style?: ViewStyle;
}

// ds-ref LoginFlow OTP box geometry (component spec, not spacing-scale values):
// mobile boxes 46×54, digit 22 mono/700; visual box gap 10 = 2 row gap + 2×4 ring wrap.
const BOX_W = 46;
const BOX_H = 54;
const DIGIT_SIZE = 22;
const ROW_GAP = 2;

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = false,
  label,
  style,
}: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    if (digits === value) return;
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <View style={[styles.root, style]}>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.row}
      >
        {Array.from({ length }, (_, i) => {
          const char = value[i] ?? '';
          const isActive = focused && !disabled && i === activeIndex;
          return (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: boxes are positional by nature
              key={i}
              style={[styles.ring, isActive && styles.ringFocused]}
            >
              <View
                style={[
                  styles.box,
                  char !== '' && !disabled && styles.boxFilled,
                  isActive && styles.boxFocused,
                  error && !disabled && styles.boxError,
                  disabled && styles.boxDisabled,
                ]}
              >
                <AppText
                  mono
                  weight="700"
                  color={
                    disabled
                      ? theme.colors['text-disabled']
                      : error
                        ? theme.colors.danger
                        : theme.colors['text-primary']
                  }
                  style={styles.digit}
                >
                  {char}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
      {/* Invisible single input over the boxes — taps anywhere focus it; SMS autofill on. */}
      <TextInput
        accessibilityLabel={label}
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        caretHidden
        editable={!disabled}
        keyboardType="number-pad"
        onBlur={() => setFocused(false)}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        selection={{ start: value.length, end: value.length }}
        style={styles.hidden}
        textContentType="oneTimeCode"
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', gap: ROW_GAP },
  // Constant ring wrapper (border 2 + padding 2, transparent at rest) — focusing never
  // shifts layout; same recipe as Input's focus ring.
  ring: {
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: theme.radius['r-input-expressive'] + 4,
  },
  ringFocused: { borderColor: theme.colors.accent },
  box: {
    width: BOX_W,
    height: BOX_H,
    borderRadius: theme.radius['r-input-expressive'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  boxFilled: { ...theme.elevation.e2 },
  boxFocused: { ...theme.elevation.e2 },
  // Error drops back to e1 under the inset danger ring (login.md §5 recipe; RN borders
  // draw inside, mirroring the web inset shadow).
  boxError: { borderWidth: 1.5, borderColor: theme.colors.danger, ...theme.elevation.e1 },
  boxDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    // RN has no `box-shadow: none` — zeroing opacity/elevation removes e1 on iOS + Android.
    shadowOpacity: 0,
    elevation: 0,
  },
  digit: { fontSize: DIGIT_SIZE, lineHeight: DIGIT_SIZE + 4 },
  // Near-zero opacity keeps the input tappable on both platforms; text never shows.
  hidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
  },
});
