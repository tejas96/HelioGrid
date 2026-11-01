import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { SheetActions } from '../Sheet';
import type { BillingRefundAskProps } from './BillingHome.parts.types';
import { plain } from './BillingHome.values';
import { BillingPairs } from './BillingPairs';

/**
 * The refund's one ask (D9, `F8-34`): it ends the plan today, so what stops is shown before the
 * act — composed exactly as the cancel ask: the rows on the 120px track and a `destructive` act.
 */
export function BillingRefundAsk({
  open,
  onClose,
  words,
  amount,
  onConfirm,
  pending,
  failure,
}: BillingRefundAskProps) {
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
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            {words.keep}
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
            { key: 'refund', label: words.refund, value: amount, under: null },
            { key: 'ends', label: words.ends, value: plain(words.today), under: null },
            { key: 'data', label: words.yourData, value: plain(words.kept), under: null },
          ]}
        />
        {failure === null ? null : (
          <span role="alert" className="hg-billing-failure">
            {failure}
          </span>
        )}
      </div>
    </EditorSurface>
  );
}
