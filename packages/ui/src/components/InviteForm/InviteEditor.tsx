import { numberOnTeam, sendsNothing } from '@heliogrid/domain';
import { useEffect, useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import type { FocusHandle } from '../SearchField/SearchField.types';
import { SheetActions } from '../Sheet/SheetActions';
import { InviteForm } from './InviteForm';
import { STACK_BELOW_LONG_ACT } from './InviteForm.logic';
import type { InviteEditorProps } from './InviteForm.types';

/** The invite as an editor over Team: Cancel before Send invite, the primary at the trailing edge. */
export function InviteEditor({
  open,
  onClose,
  bind,
  words,
  roles,
  sending,
  onSend,
  presses,
  refusal = null,
  onDifferentNumber,
  phoneRef,
}: InviteEditorProps) {
  const onTeam = numberOnTeam(refusal);
  /* At the cap the pressed *Send invite* goes away: the focus moves to *Cancel*, the one act left,
     so it never drops out of the editor. */
  const cancel = useRef<FocusHandle>(null);
  useEffect(() => {
    if (refusal === 'cap') cancel.current?.focus();
  }, [refusal]);
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      title={words.title}
      width={480}
      footer={
        <div className="hg-invite-editor-foot">
          <SheetActions stackBelow={onTeam ? STACK_BELOW_LONG_ACT : undefined}>
            <Button ref={cancel} variant="ghost" size="lg" onClick={onClose}>
              {words.cancel}
            </Button>
            {/* At the cap nothing can be sent: *Cancel* alone (owner ruling D4 A). */}
            {refusal === 'cap' ? null : onTeam ? (
              <Button variant="primary" size="lg" onClick={onDifferentNumber}>
                {words.differentNumber}
              </Button>
            ) : (
              <Button variant="primary" size="lg" loading={sending} onClick={onSend}>
                {words.send}
              </Button>
            )}
          </SheetActions>
          {/* The expiry only beside a send: a refused number and the cap send nothing. */}
          {sendsNothing(refusal) ? null : (
            <Text variant="caption" color="secondary" align="center">
              {words.lasts}
            </Text>
          )}
        </div>
      }
    >
      <InviteForm
        bind={bind}
        words={words}
        roles={roles}
        heading="quiet"
        presses={presses}
        refusal={refusal}
        phoneRef={phoneRef}
      />
    </EditorSurface>
  );
}
