import { LeadActionDock } from '../LeadActionDock';
import { LeadHero } from '../LeadHero';
import { useFormat } from '../MarketProvider';
import { QualifyCard } from '../QualifyCard';
import { leadHeroOf, leadQualifyOf, leadWorkDockOf } from './LeadWorkCards.logic';
import type { LeadWorkCardsProps } from './LeadWorkCards.types';

/** The hero, the actions and the qualify card, in that order; the column spaces them. */
export function LeadWorkCards(props: LeadWorkCardsProps) {
  const format = useFormat();
  return [
    <LeadHero key="hero" {...leadHeroOf(props, format)} />,
    <LeadActionDock key="dock" {...leadWorkDockOf(props)} />,
    <QualifyCard key="qualify" {...leadQualifyOf(props)} />,
  ];
}
