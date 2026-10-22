import { useCallback, useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { STACK_BELOW_LONG_ACT } from '../InviteForm/InviteForm.logic';
import { SheetActions } from '../Sheet/SheetActions';
import type { InviteDeclineProps } from './InviteLanding.types';

/** *This invite isn't for me*, centred under Join at 375 and last in the task at 1536; it waits while a join is out. */
export function DeclineControl({ words, decline, onPress }: InviteDeclineProps) {
  return (
    <div className="hg-invite-landing-decline">
      <Button variant="ghost" size="md" disabled={decline.held} onClick={() => onPress('decline')}>
        {words.open}
      </Button>
    </div>
  );
}

/**
 * The confirm the control opens (`m-decline-confirm`, `d-decline-confirm`): a sheet at 375 and a
 * centred danger dialog at 1536, closed only by its two acts (brief ruling 11). The overlay returns
 * the focus to the control on Keep. Drawn at the landing's root, never inside the acts: their
 * sticky row is a stacking context, and a fixed overlay inside it paints under the page beside it.
 */
export function DeclineConfirm({ words, decline, onPress }: InviteDeclineProps) {
  // One close for the confirm's whole life: the overlay re-runs its focus move whenever `onClose`
  // changes, and the landing re-renders on every tick of the resend gap while the confirm is open.
  const press = useRef(onPress);
  press.current = onPress;
  const keep = useCallback(() => press.current('keep'), []);
  const refusal =
    words.refused === null ? undefined : (
      <Banner kind="validation" tone="danger" title={words.refused} />
    );
  return (
    <EditorSurface
      open={decline.confirming}
      onClose={keep}
      closeLabel={words.keep}
      desktop="modal"
      dismissible={false}
      showClose={false}
      density="expressive"
      size="auto"
      title={words.title}
      sheetProps={{ handle: false }}
      // At 1536 the words are the dialog's description (d-decline-confirm), so its body is the
      // refusal alone — `undefined`, never `null`, or the dialog draws an empty padded body.
      modalProps={{ tone: 'danger', size: 'sm', description: words.line }}
      footer={
        <SheetActions stackBelow={STACK_BELOW_LONG_ACT}>
          <Button variant="secondary" size="lg" disabled={decline.sending} onClick={keep}>
            {words.keep}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            loading={decline.sending}
            onClick={() => onPress('confirm-decline')}
          >
            {words.go}
          </Button>
        </SheetActions>
      }
    >
      {({ panel }) =>
        panel ? (
          refusal
        ) : (
          <div className="hg-invite-landing-decline-body">
            {refusal}
            <Text variant="body-sm" color="secondary">
              {words.line}
            </Text>
          </div>
        )
      }
    </EditorSurface>
  );
}
