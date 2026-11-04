import { useImperativeHandle, useRef } from 'react';
import { landFocusOn } from '../../primitives/FocusAfter';
import { Banner, BannerAction, BannerStack } from '../Banner';
import { BillingStrip } from '../BillingStrip';
import { PlanComparison } from './PlanComparison';
import { PlanHeld } from './PlanHeld';
import { PlanPlans } from './PlanPlans';
import type { PlanSelectionProps } from './PlanSelection.types';

/**
 * The plans (`SCR-M12-03`). At 375 the regions in the order of attention — `Your plan`, the
 * cycle, the cards with the act at their foot, Enterprise, the source line, `Compare all plans`.
 * At 1536 `Your plan` is three cells in a row, the four plans stand side by side and the full
 * matrix is present one region below (decisions 1, 4, 7).
 */
export function PlanSelection(props: PlanSelectionProps) {
  const { words, view, layout, acts } = props;
  const heldFrame = useRef<HTMLDivElement>(null);
  useImperativeHandle(props.ref, () => ({ focusHeld: () => heldFrame.current?.focus() }), []);
  return (
    <div className="hg-plans" data-layout={layout}>
      {view.strip === null ? null : (
        <BillingStrip
          strip={view.strip}
          words={{
            howWorkedOut: words.howWorkedOut,
            derivationKinds: words.derivationKinds,
            moreLabel: words.bannerMore,
          }}
        />
      )}
      {view.failure === null ? null : (
        <BannerStack mode="single" moreLabel={words.bannerMore}>
          <Banner
            kind="state"
            tone="danger"
            title={view.failure.title}
            action={
              <BannerAction onClick={acts.onRetryFailure} focusAfter={heldFrame}>
                {words.tryAgain}
              </BannerAction>
            }
          >
            <span className="hg-plans-line">{view.failure.line}</span>
          </Banner>
        </BannerStack>
      )}
      <div ref={heldFrame} tabIndex={-1} className="hg-focus-target">
        <PlanHeld
          read={props.heldRead}
          held={view.held}
          words={words}
          layout={layout}
          onRetried={() => landFocusOn(props.focusAfter)}
        />
      </div>
      <PlanPlans {...props} />
      <PlanComparison {...props} />
    </div>
  );
}
