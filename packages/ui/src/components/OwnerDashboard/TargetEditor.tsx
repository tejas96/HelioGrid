import { closingPress, type FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text';
import { Button } from '../Button';
import { NumberField } from '../NumberField';
import { figureOfDraft, type TargetEditorProps, useTargetDraft } from './target-draft';

/**
 * The month's target, edited in place (`M13-17`): the amount in the tenant's currency, then *Save*
 * and *Cancel* in one row, and *Clear* for a target already set as a quiet act below. An amount
 * the wire would refuse is said on the field before anything is sent; while it saves every part
 * is inert, and a failure stays here, where the owner acted.
 */
export function TargetEditor(props: TargetEditorProps & { readonly focusAfter: FocusAfter }) {
  const { words, saving } = props;
  const draft = useTargetDraft(props);
  const leave = closingPress(props.focusAfter);
  return (
    <div className="hg-owner-target-editor">
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
      <div className="hg-owner-target-acts">
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
      </div>
      {props.initial === null ? null : (
        <span className="hg-owner-target-clear">
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => props.onSave(null)}>
            {words.clearTarget}
          </Button>
        </span>
      )}
    </div>
  );
}
