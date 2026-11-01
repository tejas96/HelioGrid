import type { BillingValue } from './BillingHome.types';

/**
 * A `BillingValue` as text: each figure run in the mono face with tabular figures (`F7-09`), the
 * words around it in the face it sits in; size and colour are the holder's.
 */
export function BillingValueText({ value }: { value: BillingValue }) {
  return (
    <>
      {value.map((run, index) =>
        run.mono ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional and never reorder
          <span key={index} className="hg-billing-mono">
            {run.text}
          </span>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional and never reorder
          <span key={index}>{run.text}</span>
        ),
      )}
    </>
  );
}
