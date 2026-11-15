import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { AfterHint, AfterSummary } from '../ProposalAfterParts';
import { withdrawSheetOf } from './ProposalWithdrawSheet.logic';
import type { ProposalWithdrawSheetProps } from './ProposalWithdrawSheet.types';
import './ProposalWithdrawSheet.css';

/** The confirm leaves with the sheet: focus then lands on the caller's `focusAfter`. */
function Confirm(props: ProposalWithdrawSheetProps) {
  const leaving = useFocusAfter(props.focusAfter);
  const { confirm } = withdrawSheetOf(props);
  if (props.words === null) return null;
  return (
    <Button {...confirm} onClick={leaving(confirm.onClick)}>
      {props.words.confirm}
    </Button>
  );
}

/** Withdraw one of two proposals, on the web: its facts, what happens, then the confirm. */
export function ProposalWithdrawSheet(props: ProposalWithdrawSheetProps) {
  const { open, words, sending, failure } = props;
  const frame = withdrawSheetOf(props);
  return (
    <EditorSurface {...frame.sheet} showClose desktop="modal">
      {open && words !== null ? (
        <div className="hg-withdraw" aria-busy={sending ? true : undefined}>
          <AfterSummary rows={words.summary} />
          <AfterHint>{words.hint}</AfterHint>
          {failure === null ? null : (
            <Text variant="body-sm" color="danger" live>
              {failure}
            </Text>
          )}
          <Confirm {...props} />
          <Text variant="caption" color="secondary" align="center">
            {words.note}
          </Text>
        </div>
      ) : null}
    </EditorSurface>
  );
}
