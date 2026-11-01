import { CANCELLATION_REASONS } from '@heliogrid/domain';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { Radio } from '../Radio';
import { SheetActions } from '../Sheet';
import type { BillingCancelAskProps } from './BillingHome.parts.types';
import { plain } from './BillingHome.values';
import { BillingPairs } from './BillingPairs';

/**
 * The cancel ask (`M12-50`, decision 15, frame 14 and d6): `Runs until` and `Your data · Kept` on
 * the 120px track, the reasons as a list, `Skip` beside the `destructive` act — a reason is never
 * a gate. A sheet at 375, a centred dialog at width. While the answer is out nothing in it acts.
 */
export function BillingCancelAsk({
  open,
  onClose,
  words,
  runsUntil,
  chosen,
  onChoose,
  onSkip,
  onConfirm,
  pending,
  failure,
}: BillingCancelAskProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      showClose
      dismissible={!pending}
      desktop="modal"
      size="auto"
      density="expressive"
      title={words.title}
      subtitle={words.subtitle}
      footer={
        <SheetActions>
          <Button variant="ghost" disabled={pending} onClick={onSkip}>
            {words.skip}
          </Button>
          <Button variant="destructive" loading={pending} disabled={pending} onClick={onConfirm}>
            {words.act}
          </Button>
        </SheetActions>
      }
    >
      <div className="hg-billing-ask">
        <BillingPairs
          label={words.title}
          facts={[
            { key: 'until', label: words.runsUntil, value: plain(runsUntil), under: null },
            { key: 'data', label: words.yourData, value: plain(words.kept), under: null },
          ]}
        />
        <div role="radiogroup" aria-label={words.whyLeaving} className="hg-billing-reasons">
          {CANCELLATION_REASONS.map((reason) => (
            <Radio
              key={reason}
              name="cancellation-reason"
              value={reason}
              label={words.reason(reason)}
              checked={chosen === reason}
              disabled={pending}
              onChange={() => onChoose(reason)}
            />
          ))}
        </div>
        {failure === null ? null : (
          <span role="alert" className="hg-billing-failure">
            {failure}
          </span>
        )}
      </div>
    </EditorSurface>
  );
}
