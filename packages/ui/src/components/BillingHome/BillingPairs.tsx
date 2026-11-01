import type { TranslatedText } from '@heliogrid/contracts';
import { FactRow, FactRows } from '../FactRow';
import type { BillingFact } from './BillingHome.types';
import { BillingValueText } from './BillingValue';

/** A fact's value on the region's right edge (decision 3); `Next bill`'s amount under its date. */
function FactValue({ fact }: { fact: BillingFact }) {
  return (
    <span className="hg-billing-fact-value">
      <span>
        <BillingValueText value={fact.value} />
      </span>
      {fact.under === null ? null : (
        <span>
          <BillingValueText value={fact.under} />
        </span>
      )}
    </span>
  );
}

/** The pairs on the shared 120px label track: `Your plan`, the includes, the method, the asks. */
export function BillingPairs({
  label,
  facts,
}: {
  label: TranslatedText;
  facts: readonly BillingFact[];
}) {
  return (
    <FactRows className="hg-billing-pairs" label={label} density="expressive" form="pair">
      {facts.map((fact) => (
        <FactRow key={fact.key} label={fact.label} value={<FactValue fact={fact} />} />
      ))}
    </FactRows>
  );
}
