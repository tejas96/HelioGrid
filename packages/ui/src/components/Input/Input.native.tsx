import { theme } from '@heliogrid/theme';
import type { KeyboardTypeOptions, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderOverride } from '../FieldOverride/FieldOverride.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import { useCommitDraft } from './commit-draft';
import type { InputDensity, InputProps, InputType } from './Input.types';

interface NativeInputProps extends InputProps {
  style?: StyleProp<ViewStyle>;
}

/* RN has no `type`; it has a keyboard and a secure flag. This is the same narrowing the web half
   applies, spelled for the platform that has to answer it differently. */
const KEYBOARD: Record<InputType, KeyboardTypeOptions> = {
  text: 'default',
  email: 'email-address',
  password: 'default',
  search: 'default',
  tel: 'phone-pad',
  url: 'url',
  number: 'numeric',
};

const SHELL_HEIGHT: Record<InputDensity, number> = { expressive: 52, functional: 40 };

const styles = StyleSheet.create({
  column: { gap: theme.spacing['sp-1'], minWidth: 0 },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 44, // the product's touch floor
    paddingHorizontal: theme.spacing['sp-4'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-input-expressive'],
    ...theme.elevation.e2,
  },
  // Density changes the size, never the ground — a control is `surface` at e2 in both (Q77).
  shellFunctional: { borderRadius: theme.radius['r-input-functional'] },
  /* RN cannot draw an inset ring, so the semantic ring is a 1.5px border of the same colour and
     the same 1.5px width — the one place this half spells a border, and only where web insets one. */
  ringError: { borderWidth: 1.5, borderColor: theme.colors.danger },
  ringSuccess: { borderWidth: 1.5, borderColor: theme.colors.success },
  ringFocus: { borderWidth: 2, borderColor: theme.colors.accent },
  shellDisabled: {
    backgroundColor: theme.colors['canvas-sunken'],
    shadowOpacity: 0,
    elevation: 0,
  },
  control: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    padding: 0,
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.roles.body.fontSize,
    color: theme.colors['text-primary'],
  },
  controlMono: { fontFamily: theme.type.families.mono },
  controlDisabled: { color: theme.colors['text-disabled'] },
});

function ringStyle(focus: boolean, error?: string, success?: boolean): ViewStyle | undefined {
  if (focus) {
    return styles.ringFocus;
  }
  if (error !== undefined) {
    return styles.ringError;
  }
  return success === true ? styles.ringSuccess : undefined;
}

/**
 * Same contract and same commit-once mechanics as the web half. Escape has no touch counterpart, so
 * the cancel route is blurring without changing the text — which restores the last committed value
 * through the same empty/unchanged guards.
 */
export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  density = 'expressive',
  error,
  success,
  helper,
  disabled = false,
  mono = false,
  leading = null,
  trailing = null,
  commitOnBlur = false,
  onCommit,
  override,
  attribution,
  style,
}: NativeInputProps) {
  const { draft, setDraft, focus, setFocus, commit } = useCommitDraft(
    value,
    commitOnBlur,
    onCommit,
  );

  const handleChangeText = (next: string) => {
    if (commitOnBlur) {
      setDraft(next);
      return;
    }
    onChange?.(next);
  };

  const handleBlur = () => {
    setFocus(false);
    if (commitOnBlur) {
      commit();
    }
  };

  /* Same two owners as the web half: FieldOverride draws the override line, ValueSource the layer
     line, and resolving the override first IS the mutual-exclusion test. */
  const overrideNode = renderOverride(override);

  const controlStyle: StyleProp<TextStyle> = [
    styles.control,
    mono ? styles.controlMono : undefined,
    disabled ? styles.controlDisabled : undefined,
  ];

  return (
    <View style={[styles.column, style]}>
      {label === undefined ? null : (
        <Text variant="body-sm" color="secondary">
          {label}
        </Text>
      )}
      <View
        style={[
          styles.shell,
          { height: SHELL_HEIGHT[density] },
          density === 'functional' ? styles.shellFunctional : undefined,
          ringStyle(focus, error, success),
          disabled ? styles.shellDisabled : undefined,
        ]}
      >
        {leading}
        <TextInput
          accessibilityLabel={label}
          editable={!disabled}
          keyboardType={KEYBOARD[type]}
          secureTextEntry={type === 'password'}
          placeholder={placeholder}
          placeholderTextColor={theme.colors['text-tertiary']}
          value={commitOnBlur ? draft : (value ?? '')}
          onChangeText={handleChangeText}
          onFocus={() => setFocus(true)}
          onBlur={handleBlur}
          onSubmitEditing={commitOnBlur ? commit : undefined}
          style={controlStyle}
        />
        {trailing}
      </View>
      {overrideNode}
      {overrideNode === null ? renderAttribution(attribution, { fieldName: label }) : null}
      {error !== undefined ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : helper !== undefined ? (
        <Text variant="caption" color="tertiary">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
