/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { useRef } from 'react';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { SheetActions } from '../Sheet/SheetActions.native';
import type { TeamConfirmProps } from './MemberCard.types';

/**
 * The confirm a Team act opens (`SCR-M01-12`): a decision, so a sheet at 375 and a centred modal at
 * 1536, neither dismissible nor closable but by its own two buttons. On the phone the caller sends
 * the screen reader back to the act that opened it. Its last words stay while it closes.
 */
export function TeamConfirm({ words, busy, onGo, onLeave }: TeamConfirmProps) {
  const last = useRef(words);
  if (words !== null) last.current = words;
  const shown = last.current;
  if (shown === null) return null;
  return (
    <EditorSurface
      open={words !== null}
      onClose={onLeave}
      closeLabel={shown.leave}
      desktop="modal"
      dismissible={false}
      showClose={false}
      density="functional"
      title={shown.title}
      sheetProps={{ handle: false }}
      modalProps={{ tone: 'danger', size: 'sm' }}
      footer={
        <SheetActions>
          <Button
            variant="destructive"
            size="lg"
            loading={busy}
            disabled={shown.goOffReason !== undefined}
            disabledReason={shown.goOffReason}
            onClick={onGo}
          >
            {shown.go}
          </Button>
          <Button variant="ghost" size="lg" onClick={onLeave}>
            {shown.leave}
          </Button>
        </SheetActions>
      }
    >
      {shown.refusal === undefined ? (
        <Text variant="body-sm" color="secondary">
          {shown.body}
        </Text>
      ) : (
        <Banner kind="validation" density="functional" title={shown.refusal.title}>
          {shown.refusal.body}
        </Banner>
      )}
    </EditorSurface>
  );
}
