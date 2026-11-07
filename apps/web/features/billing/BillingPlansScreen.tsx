'use client';
import { usePlanSelectionScreen } from '@heliogrid/data/react';
import { PRICING, planSelectionWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  LargeTitle,
  PlanReview,
  PlanSelection,
  planSelectionPageOf,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { usePlansAdapter } from './hooks/use-plans-adapter';
import './billing-plans.css';

/** The room from which the plans stand side by side and the matrix is whole (`SCR-M12-03` 1536). */
const PLANS_COLUMNS_FROM = theme.layout['bp-desktop'];

/**
 * The plans behind Billing on the web (`SCR-M12-03`): `Your plan`, the cycle, the plans, the act
 * and the comparison, and the review as the non-modal side panel at width — the settings list
 * steps aside for the plans (decision 9). What is read and acted on is
 * `usePlanSelectionScreen`'s and what is drawn `planSelectionPageOf`'s, the phone's too; this holds
 * the web's own parts — the room's layout, the new tab and where focus lands.
 */
export function BillingPlansScreen() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = usePlanSelectionScreen(usePlansAdapter());
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const heading = useRef<HTMLDivElement>(null);
  const words = planSelectionWords(t, locale, format);
  const page = planSelectionPageOf(screen, words, { format, now: Date.now() });
  const open = screen.reviewing && page.view.review !== null;
  /* The open panel takes its own room from the page, so the page's width moves under it; measured
     then, the layout would flip back to one column and take the panel's room with it. The width
     before it opened holds. */
  const settled = useRef(false);
  if (!open) settled.current = width !== null && width >= PLANS_COLUMNS_FROM;
  const wide = settled.current;
  return (
    <div
      ref={room}
      className="hg-shell-page hg-plans-page"
      data-review={open && wide ? 'open' : undefined}
    >
      <div ref={heading} tabIndex={-1} className="hg-focus-target">
        <LargeTitle title={t(PRICING.plans)} />
      </div>
      <PlanSelection {...page} layout={wide ? 'columns' : 'column'} focusAfter={heading} />
      <PlanReview
        open={open}
        layout={wide ? 'columns' : 'column'}
        view={page.view.review}
        words={words}
        acting={screen.acting}
        onClose={screen.closeReview}
        onConfirm={screen.confirm}
      />
    </div>
  );
}
