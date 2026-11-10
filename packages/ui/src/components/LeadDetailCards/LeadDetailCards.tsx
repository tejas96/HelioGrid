import { LeadContactsCard } from '../LeadContactsCard';
import { LeadSections } from '../LeadSections';
import { useFormat } from '../MarketProvider';
import { leadContactsCardOf, leadSectionsOf } from './LeadDetailCards.logic';
import type { LeadDetailCardsProps } from './LeadDetailCards.types';

/** The two cards, in the order the column takes them; the column spaces them. */
export function LeadDetailCards<Failure>(props: LeadDetailCardsProps<Failure>) {
  const format = useFormat();
  const contacts = <LeadContactsCard key="contacts" {...leadContactsCardOf(props, format)} />;
  const sections = <LeadSections key="sections" {...leadSectionsOf(props, format)} />;
  return props.first === 'contacts' ? [contacts, sections] : [sections, contacts];
}
