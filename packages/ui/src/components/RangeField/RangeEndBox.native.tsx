import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { FIELD_BOX_EDGE, fieldBox, fieldBoxText } from '../../primitives/FieldBox/FieldBox.native';
import { Text } from '../../primitives/Text/Text.native';
import { commitEnd } from './RangeField.logic';

export interface RangeEndBoxProps {
  label: string;
  value: number;
  /** This end's own window — the other end is the bound it may not cross. */
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onCommit: (value: number) => void;
}

const styles = StyleSheet.create({
  end: { flexGrow: 1, flexShrink: 1, flexBasis: 96, minWidth: 96, gap: theme.spacing['sp-1'] },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    height: 44,
    // The well and its edge are FieldBox's; the padding gives up the edge's width.
    paddingHorizontal: theme.spacing['sp-3'] - FIELD_BOX_EDGE,
  },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    fontFamily: theme.type.families.mono,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors['text-primary'],
    padding: 0,
  },
});

/**
 * Compact commit-once numeric box; the value it holds is one end of the range.
 *
 * Escape has no touch equivalent — blurring an empty or garbage box already restores the last
 * good value, which is the behaviour Escape existed to guarantee.
 */
export function RangeEndBox({
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled = false,
  onCommit,
}: RangeEndBoxProps) {
  const [draft, setDraft] = useState(String(value));
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (!focus) setDraft(String(value));
  }, [value, focus]);

  const commit = () => {
    const next = commitEnd(draft, min, max, step);
    if (next === null) {
      setDraft(String(value));
      return;
    }
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <View style={styles.end}>
      <Text variant="caption" color="tertiary">
        {label}
      </Text>
      <View style={[styles.box, fieldBox({ focused: focus, disabled, density: 'functional' })]}>
        <TextInput
          style={[styles.input, fieldBoxText(disabled)]}
          keyboardType="decimal-pad"
          value={draft}
          editable={!disabled}
          accessibilityLabel={label}
          onChangeText={setDraft}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            setFocus(false);
            commit();
          }}
          onSubmitEditing={commit}
        />
        {/* Text inside a well is secondary or stronger (`F7-15`): tertiary on the well is 4.48:1. */}
        {unit !== undefined ? (
          <Text variant="caption" color="secondary">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
