import { numberOnTeam, sendsNothing } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import { STACK_BELOW_LONG_ACT } from './InviteForm.logic';
import { InviteForm } from './InviteForm.native';
import type { InviteEditorProps } from './InviteForm.types';

/** The invite as a sheet over Team on the phone: Cancel before Send invite, the expiry under them. */
export function InviteEditor({
  open,
  onClose,
  bind,
  words,
  roles,
  sending,
  onSend,
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
        <View style={styles.foot}>
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
        </View>
      }
    >
      <InviteForm
        bind={bind}
        words={words}
        roles={roles}
        heading="quiet"
        refusal={refusal}
        phoneRef={phoneRef}
      />
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-3'] },
});
