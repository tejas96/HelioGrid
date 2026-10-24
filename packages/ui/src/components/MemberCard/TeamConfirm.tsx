import { useRef } from 'react';
import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { SheetActions } from '../Sheet/SheetActions';
import { CONFIRM_LOOK } from './MemberCard.logic';
import type { TeamConfirmProps } from './MemberCard.types';
import { TeamConfirmLines } from './TeamConfirmLines';

/**
 * The confirm a Team act opens (`SCR-M01-12`): a decision, so a sheet at 375 and a centred modal at
 * 1536, neither dismissible nor closable but by its own two buttons. Focus returns to the act that
 * opened it when it shuts (the overlay restores it). Its last words stay while it closes.
 */
export function TeamConfirm({ words, look = 'act', busy, onGo, onLeave }: TeamConfirmProps) {
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
      sheetProps={CONFIRM_LOOK[look].sheet}
      modalProps={CONFIRM_LOOK[look].modal}
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
        <TeamConfirmLines body={shown.body} note={shown.note} />
      ) : (
        <Banner kind="validation" density="functional" title={shown.refusal.title}>
          {shown.refusal.body}
        </Banner>
      )}
    </EditorSurface>
  );
}
