import type { TranslatedText } from '@heliogrid/contracts';
import { BillingChipMark } from '../BillingHome/BillingNeeds';
import { Block } from '../Block';
import { FactRow, FactRows } from '../FactRow';
import type { UsagePageView, UsagePageWords } from './UsagePage.types';
import { UsageNeeds, UsagePlainFigure, UsagePlansRow } from './UsageRegion';

/**
 * The standing column at 1536 (decision 7): `Needs you` where it exists, `This cycle` with the one
 * status chip as its badge, `Extra charges` while any accrue, and `Bigger plans`.
 */
export function UsageStanding({
  view,
  words,
  needsTitle,
  onPlans,
}: {
  view: UsagePageView;
  words: UsagePageWords;
  needsTitle: TranslatedText;
  onPlans: () => void;
}) {
  return (
    <>
      {view.needs === null ? null : <UsageNeeds title={needsTitle} rows={view.needs} />}
      {view.cycle === null ? null : (
        <Block
          title={words.thisCycle}
          density="expressive"
          badge={view.chip === null ? undefined : <BillingChipMark chip={view.chip} />}
        >
          <FactRows className="hg-usage-facts" label={words.thisCycle} density="expressive">
            <FactRow label={words.cycle} value={<UsagePlainFigure text={view.cycle.range} />} />
            <FactRow label={words.resets} value={<UsagePlainFigure text={view.cycle.resets} />} />
          </FactRows>
        </Block>
      )}
      {view.extra === null ? null : (
        <Block title={words.extraCharges} density="expressive">
          <FactRows className="hg-usage-facts" label={words.extraCharges} density="expressive">
            <FactRow label={words.soFar} value={<UsagePlainFigure text={view.extra.total} />} />
            <FactRow label={words.billsOn} value={<UsagePlainFigure text={view.extra.billsOn} />} />
          </FactRows>
        </Block>
      )}
      {view.plans === null ? null : <UsagePlansRow plans={view.plans} onPlans={onPlans} />}
    </>
  );
}
