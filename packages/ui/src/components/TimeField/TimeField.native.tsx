import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider/market-context';
import type { TimeFieldProps } from './TimeField.types';
import { TimeFieldMessage } from './TimeFieldMessage.native';
import { normaliseTime, resolvePreset, timeShape } from './time-parse';
import { useTimeEntry } from './use-time-entry';

interface NativeTimeFieldProps extends TimeFieldProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Time of day, 24-hour. Commit-once — blur or submit, never per keystroke. A time outside
 * `min`/`max` is REFUSED and the refusal names the window; it is never clamped.
 *
 * RN has no `box-shadow`, so web's two-ring stack is two boxes: an outer view holding the accent
 * focus ring (with the surface-coloured gap web draws) and the box itself holding the inset danger
 * edge. Focus rides ON TOP of danger, which is the whole point of the ordering.
 * `aria-describedby` has no RN counterpart, so `describedBy` is accepted and unused here — a
 * ringed half in a `TimeRangeField` relies on the pair's own sentence being read in order.
 * There is no Escape key on a phone, so the draft reverts when focus leaves without a legal time.
 *
 * THE VALUE IS 24-HOUR; THE DISPLAY IS THE MARKET'S (F1 / F3-20), read from `useFormat()` exactly
 * as the web half reads it — same clock, same placeholder shape, same refusal wording.
 */
export function TimeField({
  value = '',
  onCommit,
  label,
  presets = [],
  helper,
  disabled = false,
  min,
  max,
  windowName,
  density = 'expressive',
  placeholder,
  refusalMessage,
  error,
  invalid = false,
  style,
}: NativeTimeFieldProps) {
  const format = useFormat();
  const shape = timeShape(placeholder, format);
  const entry = useTimeEntry({
    format,
    max,
    min,
    onCommit,
    placeholder: shape,
    refusalMessage,
    value,
    windowName,
  });
  const hasError = error !== undefined && error !== null && error !== false;
  const danger = entry.refused !== null || hasError || invalid;

  return (
    <View style={[styles.root, style]}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.ring, entry.focus ? styles.ringFocus : undefined]}>
        <View
          style={[
            styles.box,
            density === 'functional' ? styles.boxFunctional : undefined,
            disabled ? styles.boxDisabled : undefined,
            danger ? styles.boxDanger : undefined,
          ]}
        >
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors['text-tertiary']}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Circle cx={12} cy={12} r={9} />
            <Path d="M12 7.5V12l3 2" />
          </Svg>
          <TextInput
            style={[styles.input, disabled ? styles.inputDisabled : undefined]}
            value={entry.draft}
            editable={!disabled}
            placeholder={shape}
            placeholderTextColor={theme.colors['text-tertiary']}
            accessibilityLabel={label}
            autoCorrect={false}
            autoCapitalize="none"
            onChangeText={entry.setDraft}
            onFocus={entry.focusOn}
            onBlur={entry.blur}
            onSubmitEditing={entry.submit}
          />
        </View>
      </View>
      {presets.length > 0 ? (
        <View style={styles.presets}>
          {presets.map((candidate) => {
            const preset = resolvePreset(candidate, format);
            const active = normaliseTime(preset.value) === normaliseTime(value);
            return (
              <Pressable
                key={preset.value}
                accessibilityLabel={preset.label}
                disabled={disabled}
                onPress={() => entry.pick(preset.value)}
                style={[styles.preset, active ? styles.presetActive : undefined]}
              >
                <Text
                  variant="body-sm"
                  color={active ? 'inverse' : 'secondary'}
                  style={styles.presetWords}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <TimeFieldMessage error={error} helper={helper} refused={entry.refused} />
    </View>
  );
}

const FOCUS_RING = 2;
const DANGER_RING = 1.5;
const PAD_X = 14;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
    gap: theme.spacing['sp-2'],
  },
  label: {
    fontWeight: '500',
  },
  ring: {
    borderWidth: FOCUS_RING,
    borderColor: 'transparent',
    borderRadius: theme.radius['r-input-expressive'] + FOCUS_RING * 2,
    padding: FOCUS_RING,
  },
  ringFocus: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    height: 48,
    minHeight: 44,
    paddingHorizontal: PAD_X - DANGER_RING,
    borderRadius: theme.radius['r-input-expressive'],
    borderWidth: DANGER_RING,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  boxFunctional: {
    height: 40,
    borderRadius: theme.radius['r-input-functional'],
  },
  boxDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
  },
  boxDanger: {
    borderColor: theme.colors.danger,
  },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    padding: 0,
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.body.fontSize,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: theme.colors['text-primary'],
  },
  inputDisabled: {
    color: theme.colors['text-disabled'],
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
  },
  preset: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: PAD_X,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  /* The active pill drops its elevation, the way the web half drops to box-shadow: none. */
  presetActive: {
    backgroundColor: theme.colors.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  presetWords: {
    fontWeight: '500',
  },
});
