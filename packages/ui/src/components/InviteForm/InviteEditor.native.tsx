import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { SheetActions } from '../Sheet/SheetActions.native';
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
}: InviteEditorProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      title={words.title}
      width={480}
      footer={
        <View style={styles.foot}>
          <SheetActions>
            <Button variant="ghost" size="lg" onClick={onClose}>
              {words.cancel}
            </Button>
            <Button variant="primary" size="lg" loading={sending} onClick={onSend}>
              {words.send}
            </Button>
          </SheetActions>
          <Text variant="caption" color="secondary" align="center">
            {words.lasts}
          </Text>
        </View>
      }
    >
      <InviteForm bind={bind} words={words} roles={roles} heading="quiet" />
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  foot: { gap: theme.spacing['sp-3'] },
});
