import { theme } from '@heliogrid/theme';
import { StyleSheet, TextInput, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { NumberDraftState } from './NumberField.state';

const styles = StyleSheet.create({
  /* The focus ring is an OUTER ring so it can sit ON TOP of the inset danger ring instead of
     replacing it — two channels, never one slot. It is always drawn, transparent at rest, so
     focusing the field cannot shift the layout. */
  ring: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: theme.radius['r-input-expressive'] + 2,
  },
  ringFocus: { borderColor: theme.colors.accent },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: theme.radius['r-input-expressive'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  boxFunctional: { height: 40, borderRadius: theme.radius['r-input-functional'] },
  boxSteppers: { paddingHorizontal: 0 },
  boxDisabled: { backgroundColor: theme.colors['canvas-sunken'] },
  boxDanger: { borderWidth: 1.5, borderColor: theme.colors.danger },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    textAlign: 'right',
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles.body.fontSize,
    fontWeight: '700',
    color: theme.colors['text-primary'],
    padding: 0,
  },
  inputSteppers: { textAlign: 'center' },
  step: { width: 44, flexShrink: 0, alignSelf: 'stretch' },
  unit: { paddingRight: theme.spacing['sp-1'] },
});

export interface NumberFieldBoxProps {
  draft: NumberDraftState;
  steppers: boolean;
  density: 'expressive' | 'functional';
  disabled: boolean;
  /** Refusal or error — the inset danger ring, which the focus ring is drawn ON TOP of. */
  danger: boolean;
  label?: string;
  unit?: string;
  currency: boolean;
}

/** The control itself: the two nudge targets (each a Pressable, so each is 44px), and the figure. */
export function NumberFieldBox({
  draft,
  steppers,
  density,
  disabled,
  danger,
  label,
  unit,
  currency,
}: NumberFieldBoxProps) {
  const name = label ?? 'value';
  const ink = disabled ? 'disabled' : 'secondary';
  return (
    <View style={[styles.ring, draft.focus ? styles.ringFocus : null]}>
      <View
        style={[
          styles.box,
          density === 'functional' ? styles.boxFunctional : null,
          steppers ? styles.boxSteppers : null,
          disabled ? styles.boxDisabled : null,
          danger ? styles.boxDanger : null,
        ]}
      >
        {steppers ? (
          <Pressable
            style={styles.step}
            disabled={disabled}
            accessibilityLabel={`Decrease ${name}`}
            onPress={() => draft.nudge(-1)}
          >
            <Text variant="body" color={ink}>
              −
            </Text>
          </Pressable>
        ) : null}
        <TextInput
          style={[styles.input, steppers ? styles.inputSteppers : null]}
          keyboardType="decimal-pad"
          value={draft.draft}
          editable={!disabled}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          onChangeText={draft.setDraft}
          onFocus={draft.onFocus}
          onBlur={draft.onBlur}
          onSubmitEditing={draft.commit}
        />
        {unit !== undefined && !currency ? (
          <Text variant="body-sm" color="tertiary" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
        {steppers ? (
          <Pressable
            style={styles.step}
            disabled={disabled}
            accessibilityLabel={`Increase ${name}`}
            onPress={() => draft.nudge(1)}
          >
            <Text variant="body" color={ink}>
              +
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
