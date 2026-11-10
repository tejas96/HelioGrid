import { LeadContactsCard } from '../LeadContactsCard/LeadContactsCard.native';
import { LeadSections } from '../LeadSections/LeadSections.native';
import { useFormat } from '../MarketProvider';
import { leadContactsCardOf, leadSectionsOf } from './LeadDetailCards.logic';
import type { LeadDetailCardsProps } from './LeadDetailCards.types';

/** The two cards on the phone, in the order the page takes them; the page's view spaces them. */
export function LeadDetailCards<Failure>(props: LeadDetailCardsProps<Failure>) {
  const format = useFormat();
  const contacts = <LeadContactsCard key="contacts" {...leadContactsCardOf(props, format)} />;
  const sections = <LeadSections key="sections" {...leadSectionsOf(props, format)} />;
  return props.first === 'contacts' ? [contacts, sections] : [sections, contacts];
}
