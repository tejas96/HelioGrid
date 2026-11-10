import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadContactView } from '@heliogrid/domain';
import type { LeadContactRow } from './LeadContactsCard.types';

/** The words and formats a contact row is drawn with: the role's words, the number as written. */
export interface LeadContactRowWords {
  readonly role: (role: LeadContactView['role']) => TranslatedText | null;
  // biome-ignore lint/plugin/copy-prop-type: the number as the market writes it — a fact, never words
  readonly phone: (phoneE164: string) => string;
}

/** The card's rows from domain's contacts — the customer first, exactly one primary. */
export function leadContactRowsOf(
  contacts: readonly LeadContactView[],
  words: LeadContactRowWords,
): LeadContactRow[] {
  return contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: words.phone(contact.phoneE164),
    phoneE164: contact.phoneE164,
    role: words.role(contact.role),
    primary: contact.primary,
    dial: contact.dial,
  }));
}
