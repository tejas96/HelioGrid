import { LeadActionDock } from '../LeadActionDock/LeadActionDock.native';
import { LeadHero } from '../LeadHero/LeadHero.native';
import { useFormat } from '../MarketProvider';
import { QualifyCard } from '../QualifyCard/QualifyCard.native';
import { leadHeroOf, leadQualifyOf, leadWorkDockOf } from './LeadWorkCards.logic';
import type { LeadWorkCardsProps } from './LeadWorkCards.types';

/** The hero, the dock in thumb reach and the qualify card on the phone; the page's view spaces them. */
export function LeadWorkCards(props: LeadWorkCardsProps) {
  const format = useFormat();
  return [
    <LeadHero key="hero" {...leadHeroOf(props, format)} />,
    <LeadActionDock key="dock" {...leadWorkDockOf(props)} />,
    <QualifyCard key="qualify" {...leadQualifyOf(props)} />,
  ];
}
