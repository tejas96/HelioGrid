import { createTranslator, leadsListWords } from '@heliogrid/i18n';
import { CardRows, LeadListRow, listedLeadOf, useFormat } from '@heliogrid/ui';

const en = await createTranslator('en');

/** Six hours: the spec reads the card's last activity at that age. */
const SINCE_ACTIVITY_MS = 6 * 60 * 60 * 1000;

/** A named, owned lead on its own card, as the Leads list draws it at 375. */
export function NamedLeadCard({ name, owner }: { name: string; owner: string }) {
  const format = useFormat();
  const words = leadsListWords(en.t, { pack: format.pack, language: 'en', now: Date.now() });
  return (
    <CardRows form="separate">
      <LeadListRow
        lead={listedLeadOf(
          {
            id: 'lead-1',
            name,
            phoneE164: '+919876500011',
            city: 'Pune',
            source: 'quick_add',
            stage: 'new',
            owner: { name: owner },
            monthlyBill: null,
          },
          format.pack,
        )}
        sourceLabel={words.sourceWord('quick_add')}
        lastActivity={words.lastActivity(SINCE_ACTIVITY_MS)}
        next={null}
        first
        onOpen={() => undefined}
        words={words.row}
      />
    </CardRows>
  );
}
