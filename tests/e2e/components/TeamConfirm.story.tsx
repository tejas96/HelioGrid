import type { TranslatedText } from '@heliogrid/contracts';
import type { TeamConfirmWords } from '@heliogrid/ui';
import { Button, TeamConfirm } from '@heliogrid/ui';
import { useState } from 'react';

/** An act that opens the Team confirm and shuts it on Cancel — the focus return needs both in the browser. */
export function TeamConfirmStory({ act, words }: { act: TranslatedText; words: TeamConfirmWords }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {act}
      </Button>
      <TeamConfirm
        words={open ? words : null}
        busy={false}
        onGo={() => setOpen(false)}
        onLeave={() => setOpen(false)}
      />
    </div>
  );
}
