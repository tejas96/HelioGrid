import type { LostReason } from '@heliogrid/domain';
import { createTranslator, leadDetailSheetWords } from '@heliogrid/i18n';
import { LeadActSheet } from '@heliogrid/ui';
import { useState } from 'react';
import { LOST_FIRST_DAY, LOST_POSTPONE } from '../support/lead-lost';

const en = await createTranslator('en');

/**
 * The Mark lost sheet as Lead Detail opens it, its words bound in the browser (the send's label
 * and the comes-back note are functions the form calls while it renders). The frame reports the
 * loss sent as `data-sent` — `<reason>:<day or none>`.
 */
export function LeadLostSheet({
  name = 'Kavita Joshi',
  bill = '3100.00',
}: {
  name?: string | null;
  bill?: string | null;
}) {
  const words = leadDetailSheetWords(en.t, 'copy');
  const [sent, setSent] = useState('');
  const send = (loss: { reason: LostReason; resurfaceOn: string | null }) =>
    setSent(`${loss.reason}:${loss.resurfaceOn ?? 'none'}`);
  return (
    <div data-sent={sent}>
      <LeadActSheet
        form={{
          kind: 'lost',
          lead: { name, bill: bill === null ? null : { amount: bill } },
          postpone: LOST_POSTPONE,
          firstDay: LOST_FIRST_DAY,
          comesBackAt: '09:00',
          words: words.forms.lost,
          onSend: send,
        }}
        onClose={() => undefined}
        pending={false}
        failure={null}
        closeLabel={words.close}
        fields={words.fields}
      />
    </div>
  );
}
