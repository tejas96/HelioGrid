import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { KeyboardTypeOptions, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  FIELD_BOX_EDGE,
  fieldBox,
  fieldBoxPlaceholder,
  fieldBoxText,
} from '../../primitives/FieldBox/FieldBox.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFocusRequest } from '../../primitives/use-focus-request';
import { renderOverride } from '../FieldOverride/FieldOverride.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import { useCommitDraft } from './commit-draft';
import { inputNote, ringTone } from './Input.logic';
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

const SHELL_HEIGHT: Record<InputDensity, number> = {
  expressive: theme.layout['field-h'],
  functional: theme.spacing['sp-10'],
};

const styles = StyleSheet.create({
  column: { gap: theme.spacing['sp-2'], minWidth: 0 },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 44, // the product's touch floor
    // The well's edge is always drawn, so the padding gives up its width and the text sits where it did.
    paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  },
  control: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    /* The text field reaches over the well's 1px edge, so the part a finger lands on is the
       whole 44 the well is, not 42 inside its border (Android measures the field, not the well). */
    marginVertical: -FIELD_BOX_EDGE,
    padding: 0,
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.field.value,
    color: theme.colors['text-primary'],
  },
  controlMono: { fontFamily: theme.type.families.mono },
});

/**
 * Same contract and same commit-once mechanics as the web half. Escape has no touch counterpart, so
 * the cancel route is blurring without changing the text — which restores the last committed value
 * through the same empty/unchanged guards.
 */
export function Input({
  label,
  labelSpokenOnly = false,
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
  focusRequest,
  override,
  attribution,
  style,
}: NativeInputProps) {
  const control = useRef<TextInput>(null);
  useFocusRequest(control, focusRequest);
  const { focus, setFocus, commit, shown, change, leave } = useCommitDraft(
    value,
    commitOnBlur,
    onCommit,
    onChange,
  );

  /* Same two owners as the web half: FieldOverride draws the override line, ValueSource the layer
     line, and resolving the override first IS the mutual-exclusion test. */
  const overrideNode = renderOverride(override);

  const controlStyle: StyleProp<TextStyle> = [
    styles.control,
    mono ? styles.controlMono : undefined,
    fieldBoxText(disabled),
  ];
  const note = inputNote({ error, success, helper });
  const tone = ringTone(note);

  return (
    <View style={[styles.column, style]}>
      {label === undefined || labelSpokenOnly ? null : (
        <Text variant="field-label" color="secondary">
          {label}
        </Text>
      )}
      <View
        style={[
          styles.shell,
          { height: SHELL_HEIGHT[density] },
          fieldBox({ focused: focus, tone, disabled, density }),
        ]}
      >
        {leading}
        <TextInput
          ref={control}
          accessibilityLabel={label}
          editable={!disabled}
          keyboardType={KEYBOARD[type]}
          secureTextEntry={type === 'password'}
          placeholder={placeholder}
          placeholderTextColor={fieldBoxPlaceholder(disabled)}
          value={shown}
          onChangeText={change}
          onFocus={() => setFocus(true)}
          onBlur={leave}
          onSubmitEditing={commitOnBlur ? commit : undefined}
          style={controlStyle}
        />
        {trailing}
      </View>
      {overrideNode}
      {overrideNode === null ? renderAttribution(attribution, { fieldName: label }) : null}
      {/* The line under the field (`inputNote`) — success is words with its mark, never a ring. */}
      {note?.kind === 'error' ? (
        <Text variant="field-helper" color="danger">
          {note.text}
        </Text>
      ) : note?.kind === 'success' ? (
        <StatusMark tone="success" label={note.text} />
      ) : note?.kind === 'helper' ? (
        <Text variant="field-helper" color="secondary">
          {note.text}
        </Text>
      ) : null}
    </View>
  );
}
