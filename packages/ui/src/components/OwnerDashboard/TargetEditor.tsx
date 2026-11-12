import { useState } from 'react';
import { closingPress, type FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text';
import { Button } from '../Button';
import { NumberField } from '../NumberField';
import { figureOfDraft, type TargetEditorProps } from './target-draft';

/**
 * The month's target, edited in place (`M13-17`): the amount in the tenant's currency, then *Save*,
 * *Clear* for a target already set, and *Cancel*. While it saves every part is inert; a failure
 * stays here, where the owner acted. The amount travels as the decimal the field typed.
 */
export function TargetEditor(props: TargetEditorProps & { readonly focusAfter: FocusAfter }) {
  const { words, saving } = props;
  const [draft, setDraft] = useState(props.initial ?? '');
  const leave = closingPress(props.focusAfter);
  return (
    <div className="hg-owner-target-editor">
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
      <div className="hg-owner-target-acts">
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
      </div>
    </div>
  );
}
