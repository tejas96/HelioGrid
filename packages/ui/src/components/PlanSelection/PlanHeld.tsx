import { BillingChipMark } from '../BillingHome/BillingNeeds';
import { BillingPairs } from '../BillingHome/BillingPairs';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Block } from '../Block';
import { Explainer } from '../Explainer';
import { FactRow } from '../FactRow';
import type { PlanHeldView, PlanRegionRead, PlanSelectionProps } from './PlanSelection.types';
import type { PlanSelectionWords } from './PlanSelection.words';

/**
 * `Your plan` (decisions 7, 9): the state as its one chip, the one ask in its header, the pairs —
 * three cells in one row at 1536 — and the price list's source line when it prints a price.
 */
export function PlanHeld({
  read,
  held,
  words,
  layout,
  onRetried,
}: {
  read: PlanRegionRead;
  held: PlanHeldView | null;
  words: PlanSelectionWords;
  layout: PlanSelectionProps['layout'];
  /** `Try again` has left with the failure: focus goes on. */
  onRetried: () => void;
}) {
  if (read.kind !== 'ready' || held === null) {
    return (
      <Block
        title={words.yourPlan}
        density="expressive"
        read={
          read.kind === 'failed'
            ? {
                kind: 'failed',
                retry: () => {
                  read.retry();
                  onRetried();
                },
              }
            : read.kind === 'ready'
              ? { kind: 'loading' }
              : read
        }
        loadingLabel={words.loadingPlan}
        emptyTitle={words.failedPlanTitle}
        errorTitle={words.failedPlanTitle}
        errorMessage={words.failedPlanMessage}
        retryLabel={words.tryAgain}
      />
    );
  }
  return (
    <Block
      title={words.yourPlan}
      density="expressive"
      badge={<BillingChipMark chip={held.chip} />}
      action={
        held.ask ? (
          <Explainer
            label={words.aboutReading}
            title={words.readingTitle}
            placement="bottom"
            inset
            pages={words.readingBody}
          />
        ) : undefined
      }
      provenance={held.source === null ? undefined : { source: held.source }}
    >
      {layout === 'columns' ? (
        <div className="hg-plans-held-cells">
          {held.rows.map((fact) => (
            <FactRow
              key={fact.key}
              form="pair"
              label={fact.label}
              value={<BillingValueText value={fact.value} />}
            />
          ))}
        </div>
      ) : (
        <BillingPairs label={words.yourPlan} facts={held.rows} />
      )}
    </Block>
  );
}
