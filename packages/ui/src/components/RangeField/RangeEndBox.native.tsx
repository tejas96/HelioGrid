import { theme } from '@heliogrid/theme';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
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
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-input-functional'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  boxDisabled: { backgroundColor: theme.colors['canvas-sunken'] },
  boxFocus: { borderWidth: 2, borderColor: theme.colors.accent, shadowOpacity: 0, elevation: 0 },
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
      <View
        style={[styles.box, disabled ? styles.boxDisabled : null, focus ? styles.boxFocus : null]}
      >
        <TextInput
          style={styles.input}
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
        {unit !== undefined ? (
          <Text variant="caption" color="tertiary">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
