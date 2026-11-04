import { usePlanSelectionScreen } from '@heliogrid/data/react';
import { BILLING_HOME, PRICING, planSelectionWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type FocusHandle,
  PlanReview,
  PlanSelection,
  planSelectionPageOf,
  useFormat,
} from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { ShellPage } from '../shell/components/ShellPage';
import { usePlansAdapter } from './hooks/use-plans-adapter';

/**
 * The plans on the phone (`SCR-M12-03`, the 375 frames), opened by `Change plan` and the trial's
 * `Pick a plan`: the plans page's bar with its way back to Billing, the body in one column, and
 * the review as the sheet that rises from the act. What is read and acted on is
 * `usePlanSelectionScreen`'s and what is drawn `planSelectionPageOf`'s, the web's too.
 */
export function BillingPlansScreen() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const navigation = useNavigation();
  const screen = usePlanSelectionScreen(usePlansAdapter());
  const words = planSelectionWords(t, locale, format);
  const page = planSelectionPageOf(screen, words, { format, now: Date.now() });
  /* The bar's title: where a region's `Try again` hands the screen reader once it has gone. */
  const heading = useRef<FocusHandle>(null);
  return (
    <ShellPage
      inView="more"
      drillDown={{
        title: t(PRICING.plans),
        back: t(BILLING_HOME.backToBilling),
        onBack: () => navigation.goBack(),
        titleRef: heading,
      }}
    >
      <PlanSelection {...page} layout="column" focusAfter={heading} />
      <PlanReview
        open={screen.reviewing && page.view.review !== null}
        layout="column"
        view={page.view.review}
        words={words}
        acting={screen.acting}
        onClose={screen.closeReview}
        onConfirm={screen.confirm}
      />
    </ShellPage>
  );
}
