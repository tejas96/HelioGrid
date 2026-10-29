/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { closeKeyboard } from '../../primitives/Keyboard/use-keyboard.native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { STACK_BELOW_LONG_ACT } from '../InviteForm/InviteForm.logic';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { InviteDeclineProps } from './InviteLanding.types';

/**
 * *This invite isn't for me*, centred under Join, and the confirm it opens (`m-decline-confirm`):
 * a sheet closed only by its two acts (brief ruling 11), drawn through the portal over the whole
 * screen. Opening it closes the keyboard, which would cover a sheet rising from the foot; Keep
 * sends the screen reader back to the control, as the web overlay does by itself.
 */
export function InviteDecline({ words, decline, onPress, focusAfter }: InviteDeclineProps) {
  const control = useRef<FocusHandle>(null);
  /* A confirmed decline takes the control and the invite away: the screen reader goes to the
     declined frame's act. */
  const leaving = useFocusAfter(focusAfter);
  const keep = () => {
    onPress('keep');
    control.current?.focus();
  };
  const refusal =
    words.refused === null ? undefined : (
      <Banner kind="validation" tone="danger" title={words.refused} />
    );
  return (
    <View style={styles.control}>
      <Button
        ref={control}
        variant="ghost"
        size="md"
        disabled={decline.held}
        onClick={() => {
          closeKeyboard();
          onPress('decline');
        }}
      >
        {words.open}
      </Button>
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
        // As a tablet's dialog the words are its description, so its body is the refusal alone —
        // `undefined`, never `null`, or the dialog draws an empty padded body.
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
              onClick={leaving(() => onPress('confirm-decline'))}
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
            <View style={styles.body}>
              {refusal}
              <Text variant="body-sm" color="secondary">
                {words.line}
              </Text>
            </View>
          )
        }
      </EditorSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  control: { alignItems: 'center' },
  body: { gap: theme.spacing['sp-4'] },
});
