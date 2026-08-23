import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { renderOverride } from '../FieldOverride/FieldOverride.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { renderAttribution } from '../ValueSource/ValueSource.native';
import { useNumberFieldDraft } from './NumberField.state';
import type { NumberFieldProps } from './NumberField.types';
import { NumberFieldBox } from './NumberFieldBox.native';
import { NumberFieldMessage } from './NumberFieldMessage.native';

interface NativeNumberFieldProps extends NumberFieldProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  slot: { marginTop: theme.spacing['sp-2'], marginHorizontal: 2 },
  provenance: { marginTop: 6, marginHorizontal: 2 },
});

/**
 * Typed dimensions on touch. Commits once on blur or the keyboard's Done key, never per
 * keystroke; empty or invalid restores the last good value.
 *
 * Escape has no touch equivalent — a cancel gesture would be invented UI, and blurring already
 * commits nothing when the draft is empty or invalid. ArrowUp/ArrowDown likewise: the +/− targets
 * ARE the nudge on touch, and each is a Pressable, so each is 44px.
 */
export function NumberField({
  value = 0,
  onCommit,
  min,
  max,
  step = 1,
  precision,
  label,
  unit,
  hint,
  disabled = false,
  density = 'expressive',
  currency = false,
  provenance,
  override,
  attribution,
  outOfRange = 'clamp',
  refusalMessage,
  refusalPath,
  steppers,
  correctionMessage,
  error,
  style,
}: NativeNumberFieldProps) {
  const showSteppers = steppers ?? !currency;
  const draft = useNumberFieldDraft({
    value,
    onCommit,
    min,
    max,
    step,
    precision,
    currency,
    unit,
    outOfRange,
    correctionMessage,
  });

  const refused =
    draft.refusal === null
      ? null
      : (refusalMessage ?? (
          <Text variant="caption" color="danger">
            {draft.refusal}
            {refusalPath}
          </Text>
        ));
  const danger = draft.refusal !== null || error !== undefined;

  return (
    <View style={style}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <NumberFieldBox
        draft={draft}
        steppers={showSteppers}
        density={density}
        disabled={disabled}
        danger={danger}
        label={label}
        unit={unit}
        currency={currency}
      />
      <NumberFieldSlots
        override={override}
        attribution={attribution}
        provenance={provenance}
        label={label}
      />
      <NumberFieldMessage
        refused={refused}
        error={error}
        correction={draft.correction}
        hint={hint}
      />
    </View>
  );
}

/**
 * Same two owners and the same slot rule as the web half. `FieldOverride` draws "a person replaced
 * the derived default" (M05-72), `ValueSource` draws "which layer supplied this" (SCR-M01-15), and
 * resolving the override first enforces ONE OF THE TWO, NEVER BOTH. Provenance is a different axis
 * and keeps its own slot below, directly under the value it qualifies and above the hint.
 */
function NumberFieldSlots({
  override,
  attribution,
  provenance,
  label,
}: Pick<NumberFieldProps, 'override' | 'attribution' | 'provenance' | 'label'>) {
  const overrideNode = renderOverride(override);
  const attributionNode =
    overrideNode === null ? renderAttribution(attribution, { fieldName: label }) : null;
  const provenanceNode = renderProvenance(provenance, { size: 12 });

  return (
    <>
      {overrideNode === null ? null : <View style={styles.slot}>{overrideNode}</View>}
      {attributionNode === null ? null : <View style={styles.slot}>{attributionNode}</View>}
      {provenanceNode === null ? null : <View style={styles.provenance}>{provenanceNode}</View>}
    </>
  );
}
