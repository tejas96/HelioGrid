import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { closingPress, type FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { NumberField } from '../NumberField/NumberField.native';
import { figureOfDraft, type TargetEditorProps, useTargetDraft } from './target-draft';

/**
 * The month's target, edited in place on the phone (`M13-17`): the amount in the tenant's currency,
 * committed as typed — a tap on *Save* never leaves the field first — then *Save* and *Cancel* in
 * one row, and *Clear* for a target already set as a quiet act below. An amount the wire would
 * refuse is said on the field before anything is sent; while it saves every part is inert, and a
 * failure stays here.
 */
export function TargetEditor(props: TargetEditorProps & { readonly focusAfter: FocusAfter }) {
  const { words, saving } = props;
  const draft = useTargetDraft(props);
  const leave = closingPress(props.focusAfter);
  return (
    <View style={styles.editor}>
      <NumberField
        label={words.targetLabel}
        words={words.numberField}
        value={figureOfDraft(draft.draft)}
        onCommit={draft.onCommit}
        commits="as-typed"
        onClear={draft.onClear}
        currency
        outOfRange="refuse"
        density="functional"
        disabled={saving}
        focusRequest={draft.focusRequest}
        error={draft.error}
      />
      {draft.failed ? (
        <Text variant="body-sm" color="danger" live>
          {words.targetFailed}
        </Text>
      ) : null}
      <View style={styles.acts}>
        <Button
          variant="primary"
          size="md"
          loading={saving}
          disabled={draft.draft === '' || saving}
          onClick={draft.save}
        >
          {words.saveTarget}
        </Button>
        <Button variant="ghost" size="md" disabled={saving} onClick={leave(props.onCancel)}>
          {words.cancel}
        </Button>
      </View>
      {props.initial === null ? null : (
        <View style={styles.clear}>
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => props.onSave(null)}>
            {words.clearTarget}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { gap: theme.spacing['sp-2'] },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  clear: { alignSelf: 'flex-start', marginStart: -theme.spacing['sp-3'] },
});
