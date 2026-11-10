import type { DedupeChoice, UiLanguage } from '@heliogrid/domain';
import { createTranslator, dedupeSheetWords, SHELL } from '@heliogrid/i18n';
import { DedupeSheet } from '@heliogrid/ui';
import { useState } from 'react';
import { TYPED_PHONE } from '../support/crm-sheets';

const READERS = { en: await createTranslator('en'), hi: await createTranslator('hi') };
const DAY_MS = 86_400_000;

/**
 * The duplicate sheet as quick add holds it, its words bound in the browser (the stage track's
 * spoken name is a function the sheet calls while it renders). The frame reports the act sent as
 * `data-sent` — `keep_both:<reason>` for a kept pair — and a close as `data-closed`. `act` draws
 * an act still out, or one that came back with the shell's keeps-failing sentence.
 */
export function DedupeSheetAsCaptured({
  reader = 'en',
  inScope = true,
  ownerName = 'Rajesh Jadhav',
  canKeepBoth = true,
  act = null,
}: {
  reader?: Extract<UiLanguage, 'en' | 'hi'>;
  inScope?: boolean;
  ownerName?: string | null;
  canKeepBoth?: boolean;
  act?: { state: 'waiting' | 'failed'; choice: DedupeChoice } | null;
}) {
  const { t } = READERS[reader];
  const [open, setOpen] = useState(true);
  const [sent, setSent] = useState('');
  const words = dedupeSheetWords(t, {
    phone: TYPED_PHONE,
    inScope,
    recordName: inScope ? 'Priya Sharma' : null,
    ownerName,
    stage: 'qualified',
    lastContactElapsedMs: 4 * DAY_MS,
  });
  return (
    <div lang={reader} data-sent={sent} data-closed={!open}>
      <DedupeSheet
        open={open}
        onClose={() => setOpen(false)}
        record={
          inScope
            ? { kind: 'visible', name: 'Priya Sharma', city: 'Nashik' }
            : { kind: 'out_of_scope' }
        }
        ownerName={ownerName}
        stage="qualified"
        canKeepBoth={canKeepBoth}
        act={
          act === null
            ? null
            : act.state === 'waiting'
              ? { state: 'waiting', choice: act.choice }
              : { state: 'failed', choice: act.choice, reason: t(SHELL.keepsFailing) }
        }
        onOpenExisting={() => setSent('open_existing')}
        onLogEnquiry={() => setSent('log_enquiry')}
        onKeepBoth={(reason) => setSent(`keep_both:${reason}`)}
        words={words}
      />
    </div>
  );
}
