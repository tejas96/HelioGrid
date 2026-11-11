import { CANCEL_REASONS, type CancelReason } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { Input } from '../Input/Input.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { cancelNoteNeeded, footOf, keepOf } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend.native';
import { useTypedDraft } from './use-typed-draft';

/**
 * Cancel on the phone (`M08-51`): why, from the closed reasons, and a note — needed only for
 * *Something else*. The send is the danger one; *Keep it* is the way out.
 */
export function CancelForm({ form, words, ...frame }: ProjectFormOf<'cancel'>) {
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [tried, setTried] = useState(false);
  const note = useTypedDraft('', frame.sending);
  const missing = cancelNoteNeeded(reason, note.typed);
  return (
    <View style={styles.form}>
      <OptionCardGroup
        label={words.cancel.reason}
        density="functional"
        disabled={frame.sending}
        {...(reason === null ? {} : { value: reason })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-4'] },
});
