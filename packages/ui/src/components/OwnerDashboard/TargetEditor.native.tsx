import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { closingPress, type FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { NumberField } from '../NumberField/NumberField.native';
import { figureOfDraft, type TargetEditorProps } from './target-draft';

/**
 * The month's target, edited in place on the phone (`M13-17`): the amount in the tenant's currency,
 * committed as typed — a tap on *Save* never leaves the field first — then *Save*, *Clear* for a
 * target already set, and *Cancel*. While it saves every part is inert; a failure stays here.
 */
export function TargetEditor(props: TargetEditorProps & { readonly focusAfter: FocusAfter }) {
  const { words, saving } = props;
  const [draft, setDraft] = useState(props.initial ?? '');
  const leave = closingPress(props.focusAfter);
  return (
    <View style={styles.editor}>
      <NumberField
        label={words.targetLabel}
        words={words.numberField}
        value={figureOfDraft(draft)}
        onCommit={(value) => setDraft(String(value))}
        commits="as-typed"
        onClear={() => setDraft('')}
        currency
        outOfRange="refuse"
        min={0}
        density="functional"
        disabled={saving}
        focusRequest={1}
      />
      {props.failed ? (
        <Text variant="body-sm" color="danger" live>
          {words.targetFailed}
        </Text>
      ) : null}
      <View style={styles.acts}>
        <Button
          variant="primary"
          size="md"
          loading={saving}
          disabled={draft === '' || saving}
          onClick={() => props.onSave(draft)}
        >
          {words.saveTarget}
        </Button>
        {props.initial === null ? null : (
          <Button variant="ghost" size="md" disabled={saving} onClick={() => props.onSave(null)}>
            {words.clearTarget}
          </Button>
        )}
        <Button variant="ghost" size="md" disabled={saving} onClick={leave(props.onCancel)}>
          {words.cancel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { gap: theme.spacing['sp-2'] },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
});
