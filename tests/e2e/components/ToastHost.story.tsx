import { Button, ToastHost, useToasts } from '@heliogrid/ui';
import { useState } from 'react';

/** A queue with one undoable toast: the frame counts the undos it ran as `data-undone`. */
export function UndoToastStory({ act, title, undo }: { act: string; title: string; undo: string }) {
  const toasts = useToasts();
  const [undone, setUndone] = useState(0);
  return (
    <div data-undone={undone}>
      <Button
        variant="secondary"
        onClick={() =>
          toasts.push({ title, undo: { label: undo, onUndo: () => setUndone((n) => n + 1) } })
        }
      >
        {act}
      </Button>
      <ToastHost toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}
