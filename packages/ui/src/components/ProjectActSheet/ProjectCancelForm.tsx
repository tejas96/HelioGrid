import { CANCEL_REASONS, type CancelReason } from '@heliogrid/domain';
import { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { OptionCardGroup } from '../OptionCardGroup';
import { cancelNoteNeeded, footOf, keepOf } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend';
import { useTypedDraft } from './use-typed-draft';

/**
 * Cancel (`M08-51`, the picked design): why, from the closed reasons, and a note — needed only for
 * *Something else*. The send is the danger one; *Keep it* is the way out.
 */
export function CancelForm({ form, words, ...frame }: ProjectFormOf<'cancel'>) {
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [tried, setTried] = useState(false);
  const note = useTypedDraft('', frame.sending);
  const missing = cancelNoteNeeded(reason, note.typed);
  return (
    <>
      <OptionCardGroup
        label={words.cancel.reason}
        density="functional"
        disabled={frame.sending}
        value={reason ?? undefined}
        options={CANCEL_REASONS.map((each) => ({
          value: each,
          title: words.cancel.reasonWord(each),
        }))}
        onChange={(value) => setReason(CANCEL_REASONS.find((each) => each === value) ?? null)}
      />
      <Input
        label={words.cancel.note}
        {...note.field}
        {...(tried && missing ? { error: words.cancel.noteNeeded } : {})}
      />
      <ProjectSheetSend
        label={words.cancel.send}
        ready={reason !== null}
        {...footOf(frame)}
        onSend={() => {
          setTried(true);
          if (reason !== null && !missing) form.onSend(reason, note.typed);
        }}
        glyph="blocked"
        destructive
      />
      <Button {...keepOf(frame)}>{words.cancel.keep}</Button>
    </>
  );
}
