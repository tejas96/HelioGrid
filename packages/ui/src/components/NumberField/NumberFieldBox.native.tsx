import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { FIELD_BOX_EDGE, fieldBox, fieldBoxText } from '../../primitives/FieldBox/FieldBox.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFocusRequest } from '../../primitives/use-focus-request';
import type { NumberDraftState } from './NumberField.state';

const styles = StyleSheet.create({
  /* The well and its edge ring are FieldBox's; the padding gives up the edge's width so the
     figure sits where it did. */
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.layout['field-h'],
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  },
  boxFunctional: { height: 40 },
  boxSteppers: { paddingHorizontal: 0 },
  /* `Input`'s face: a typed figure reads as what was typed, from where the caret starts, and its
     unit closes the field at the end. */
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    /* Over the well's 1px edge, as `Input`'s field: the target is the well's whole 44. */
    marginVertical: -FIELD_BOX_EDGE,
    textAlign: 'left',
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.field.value,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
    color: theme.colors['text-primary'],
    padding: 0,
  },
  inputSteppers: { textAlign: 'center' },
  /* An amount is money, and money is mono wherever it is read (`F7-09`). */
  inputCurrency: { fontFamily: theme.type.families.mono },
  step: { width: 44, flexShrink: 0, alignSelf: 'stretch' },
  unit: { paddingRight: theme.spacing['sp-1'] },
});

export interface NumberFieldBoxProps {
  draft: NumberDraftState;
  steppers: boolean;
  density: 'expressive' | 'functional';
  disabled: boolean;
  /** Refusal or error — the danger edge; while focused the edge is the focus ring instead. */
  danger: boolean;
  /** The field's accessible name — its `label`, or its `ariaLabel` when no label is drawn. */
  name?: string;
  unit?: string;
  currency: boolean;
  /** `NumberFieldProps.focusRequest`. */
  focusRequest?: number;
}

/** The control itself: the two nudge targets (each a Pressable, so each is 44px), and the figure. */
export function NumberFieldBox({
  draft,
  steppers,
  density,
  disabled,
  danger,
  name,
  unit,
  currency,
  focusRequest,
}: NumberFieldBoxProps) {
  const control = useRef<TextInput>(null);
  useFocusRequest(control, focusRequest);
  const stepperName = name ?? 'value';
  const ink = disabled ? 'disabled' : 'secondary';
  return (
    <View
      style={[
        styles.box,
        density === 'functional' ? styles.boxFunctional : null,
        steppers ? styles.boxSteppers : null,
        fieldBox({ focused: draft.focus, tone: danger ? 'error' : 'none', disabled, density }),
      ]}
    >
      {steppers ? (
        <Pressable
          style={styles.step}
          disabled={disabled}
          accessibilityLabel={`Decrease ${stepperName}`}
          onPress={() => draft.nudge(-1)}
        >
          <Text variant="field-value" color={ink}>
            −
          </Text>
        </Pressable>
      ) : null}
      <TextInput
        ref={control}
        style={[
          styles.input,
          steppers ? styles.inputSteppers : null,
          currency ? styles.inputCurrency : null,
          fieldBoxText(disabled),
        ]}
        keyboardType="decimal-pad"
        value={draft.draft}
        editable={!disabled}
        accessibilityLabel={name}
        accessibilityState={{ disabled }}
        onChangeText={draft.setDraft}
        onFocus={draft.onFocus}
        onBlur={draft.onBlur}
        onSubmitEditing={draft.commit}
      />
      {unit !== undefined && !currency ? (
        <Text variant="body-sm" color="secondary" style={styles.unit}>
          {unit}
        </Text>
      ) : null}
      {steppers ? (
        <Pressable
          style={styles.step}
          disabled={disabled}
          accessibilityLabel={`Increase ${stepperName}`}
          onPress={() => draft.nudge(1)}
        >
          <Text variant="field-value" color={ink}>
            +
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
