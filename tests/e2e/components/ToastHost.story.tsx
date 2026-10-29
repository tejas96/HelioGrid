import type { TranslatedText } from '@heliogrid/contracts';
import { Button, ToastHost, useToasts } from '@heliogrid/ui';
import { useState } from 'react';

/** A queue with one undoable toast: the frame counts the undos it ran as `data-undone`. */
export function UndoToastStory({
  act,
  title,
  undo,
  dismiss,
}: {
  act: TranslatedText;
  title: TranslatedText;
  undo: TranslatedText;
  dismiss: TranslatedText;
}) {
  const toasts = useToasts();
  const [undone, setUndone] = useState(0);
  return (
    <div data-undone={undone}>
      <Button
        variant="secondary"
        onClick={() =>
          toasts.push({
            title,
            undo: {
              label: undo,
              onUndo: () => setUndone((n) => n + 1),
              focusAfter: { current: null },
            },
          })
        }
      >
        {act}
      </Button>
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        dismissLabel={dismiss}
        focusAfter={{ current: null }}
      />
    </div>
  );
}
