import { assignPendingWords, assignPickerWords, createTranslator } from '@heliogrid/i18n';
import { AssignPicker } from '@heliogrid/ui';
import { useState } from 'react';
import { TEAM } from '../support/crm-sheets';

const en = await createTranslator('en');

/**
 * The assign picker as the inbox holds it for one lead, its words bound in the browser (the
 * counts are functions the picker calls while it renders). The frame reports each pick as
 * `data-picked` and a close as `data-closed`. `waitingOn` draws an assign to that person still out.
 */
export function AssignPickerForLead({
  ownerId = null,
  waitingOn = null,
  failed = false,
}: {
  ownerId?: string | null;
  waitingOn?: string | null;
  failed?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [retried, setRetried] = useState(false);
  return (
    <div data-picked={picked.join(',')} data-closed={!open} data-retried={retried}>
      <AssignPicker
        open={open}
        onClose={() => setOpen(false)}
        read={failed ? { kind: 'failed', retry: () => setRetried(true) } : { kind: 'ready' }}
        people={failed ? [] : TEAM}
        ownerId={ownerId}
        readerId="me"
        onPick={(userId) => setPicked((before) => [...before, userId])}
        pending={
          waitingOn === null
            ? null
            : {
                userId: waitingOn,
                line: { label: assignPendingWords(en.t).assigning('Neha Kulkarni') },
              }
        }
        words={assignPickerWords(en.t, { name: 'Priya Sharma' })}
      />
    </div>
  );
}
