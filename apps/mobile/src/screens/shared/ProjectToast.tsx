import type { ProjectScreen } from '@heliogrid/data/react';
import { UNDO_TOAST_MS } from '@heliogrid/domain';
import type { ProjectToastCopy } from '@heliogrid/i18n';
import type { FocusAfter } from '@heliogrid/ui';
import { OneToast } from './OneToast';

/** An act's one line above the pill, with its *Undo* where a person's own move can be taken back (ruling 16). */
export function ProjectToast({
  screen,
  words,
  focusAfter,
}: {
  screen: ProjectScreen;
  words: ProjectToastCopy;
  focusAfter: FocusAfter;
}) {
  const { toast, undo } = screen;
  return (
    <OneToast
      fact={toast}
      line={(said) => ({
        tone: 'success',
        title: words.title(said),
        ...('undoable' in said && said.undoable
          ? { undo: { label: words.undo, onUndo: undo }, duration: UNDO_TOAST_MS }
          : {}),
      })}
      onDismiss={screen.dismissToast}
      focusAfter={focusAfter}
    />
  );
}
