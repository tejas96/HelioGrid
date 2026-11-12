import { classNames } from '../../primitives/class-names';
import { bankFactsOf } from './CollectionsSettings.logic';
import type { BankFactsProps } from './CollectionsSettings.types';
import './CollectionsSettings.css';

/** The bank account on the web: a definition list, term beside value. */
export function BankFacts(props: BankFactsProps) {
  return (
    <dl className="hg-collections-facts">
      {bankFactsOf(props).map((fact) => (
        <div key={fact.key} className="hg-collections-fact">
          <dt>{fact.term}</dt>
          <dd className={classNames(fact.mono ? 'hg-collections-mono' : undefined)}>
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
