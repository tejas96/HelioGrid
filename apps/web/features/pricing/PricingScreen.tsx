'use client';
import { type PricingView, usePricingPage } from '@heliogrid/data/react';
import { BILLING_CYCLES, IN_PACK } from '@heliogrid/domain';
import { PRICING, packWords } from '@heliogrid/i18n';
import { useI18n, useTranslate } from '@heliogrid/i18n/react';
import { Block, FactRow, FactRows, FilterChips, Provenance, useFormat } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { COMPANY_SIGNUP_ROUTE, LOGIN_ROUTE } from '../auth';
import { ComparedWith } from './components/ComparedWith';
import { PlanCard } from './components/PlanCard';
import { PlanCompare } from './components/PlanCompare';
import { PlanGrid } from './components/PlanGrid';
import { PlanIncludes } from './components/PlanIncludes';
import { PricingHeader } from './components/PricingHeader';
import { ChipField, SetChips } from './components/SetChips';
import { TrialAct } from './components/TrialAct';
import { TrialCaps } from './components/TrialCaps';
import { useFocusAfterRetry } from './hooks/use-focus-after-retry';
import './pricing.css';
import './pricing-desk.css';

/**
 * The public pricing page (`SCR-M12-01`), for the launch market: the price list read, its four
 * plans, the comparison, `Compared with` and the one trial act. No shell, before sign-in. Where
 * there are no prices to read — loading, no book, a failed read — the cycle, the comparison and the
 * trial act are absent, not disabled (decisions 4 and 14).
 */
export function PricingScreen() {
  const t = useTranslate();
  const { locale } = useI18n();
  const format = useFormat();
  const router = useRouter();
  const page = usePricingPage(IN_PACK.market);
  const { view } = page;
  const plansRegion = useFocusAfterRetry<HTMLElement>(page.read.kind);
  const startTrial = () => router.push(COMPANY_SIGNUP_ROUTE);
  const trialLine = view === null ? null : t(PRICING.trialLine, { days: view.trial.days });
  const listSource =
    view === null
      ? ''
      : t(PRICING.priceList, {
          market: packWords(format.pack.name, locale),
          date: format.date(view.publishedAt),
        });
  const talkToSales = (contact: string | null) =>
    contact === null ? null : () => window.location.assign(`mailto:${contact}`);

  return (
    <div className="hg-pricing">
      <PricingHeader
        signIn={t(PRICING.signIn)}
        onSignIn={() => router.push(LOGIN_ROUTE)}
        trial={
          trialLine === null ? null : (
            <TrialAct
              label={t(PRICING.startTrial)}
              line={trialLine}
              size="md"
              onStart={startTrial}
            />
          )
        }
      />
      <main className="hg-pricing-body">
        <div className="hg-pricing-intro">
          <div className="hg-pricing-intro__words">
            <h1 className="hg-pricing-title">{t(PRICING.title)}</h1>
            <span className="hg-pricing-claim">{t(PRICING.claim)}</span>
          </div>
          <div className="hg-pricing-intro__includes">
            <PlanIncludes open={page.includesOpen} onToggle={page.toggleIncludes} />
          </div>
        </div>

        <section
          ref={plansRegion}
          tabIndex={-1}
          className="hg-pricing-plans hg-focus-target"
          aria-label={t(PRICING.plans)}
        >
          {view === null ? (
            <Block
              read={page.read}
              loadingLabel={t(PRICING.loading)}
              density="expressive"
              emptyTitle={t(PRICING.emptyTitle)}
              errorTitle={t(PRICING.errorTitle)}
              errorMessage={t(PRICING.errorMessage)}
              retryLabel={t(PRICING.retry)}
            />
          ) : (
            <>
              <ChipField label={t(PRICING.cycle)}>
                <FilterChips
                  label={t(PRICING.cycle)}
                  value={page.cycle}
                  onChange={(next) =>
                    page.chooseCycle(BILLING_CYCLES.find((cycle) => cycle === next) ?? page.cycle)
                  }
                  options={[
                    { value: 'monthly', label: t(PRICING.monthly) },
                    { value: 'yearly', label: t(PRICING.yearly) },
                  ]}
                />
                <FactRows density="expressive" form="lead">
                  <FactRow label={t(PRICING.yearly)} value={t(PRICING.yearlyDeal)} />
                </FactRows>
              </ChipField>
              <div className="hg-pricing-cards">
                {view.plans.map((plan) => (
                  <PlanCard
                    key={plan.tier}
                    plan={plan}
                    cycle={page.cycle}
                    open={page.openPlan === plan.tier}
                    onToggle={() => page.togglePlan(plan.tier)}
                    onTalkToSales={talkToSales(view.salesContact)}
                  />
                ))}
              </div>
              <ListFoot view={view} source={listSource} />
            </>
          )}
        </section>

        {view === null ? null : (
          <div className="hg-pricing-foot">
            <div className="hg-pricing-foot__compare">
              {page.pair === null ? null : (
                <div className="hg-pricing-phone-only">
                  <PlanCompare
                    plans={view.plans}
                    open={page.compareOpen}
                    onToggle={page.toggleCompare}
                    pair={page.pair}
                    planOptions={page.planOptions}
                    againstOptions={page.againstOptions}
                    onPlan={page.choosePlan}
                    onAgainst={page.chooseAgainst}
                    set={page.set}
                    onSet={page.chooseSet}
                    source={listSource}
                  />
                </div>
              )}
              <div className="hg-pricing-desk-only hg-pricing-matrix">
                <SetChips value={page.set} onChange={page.chooseSet} />
                <PlanGrid
                  plans={view.plans}
                  set={page.set}
                  caption={t(PRICING.allPlans, { count: String(view.plans.length) })}
                  source={listSource}
                  columnWidth={169}
                  labelWidth={200}
                />
              </div>
            </div>
            <div className="hg-pricing-foot__side">
              {view.comparisons.length === 0 ? null : (
                <ComparedWith
                  comparisons={view.comparisons}
                  listSource={listSource}
                  benchmarkSources={view.benchmarkSources.map((source) =>
                    t(PRICING.benchmarkSource, {
                      competitor: source.competitor,
                      date: format.date(source.readOn),
                    }),
                  )}
                />
              )}
              <div className="hg-pricing-phone-only">
                <TrialCaps
                  {...trialCaps(view)}
                  open={page.trialOpen}
                  onToggle={page.toggleTrial}
                  source={listSource}
                />
              </div>
              <div className="hg-pricing-desk-only">
                <TrialCaps {...trialCaps(view)} open source={listSource} />
              </div>
            </div>
          </div>
        )}
      </main>

      {trialLine === null ? null : (
        <footer className="hg-pricing-pinned hg-pricing-phone-only">
          <TrialAct label={t(PRICING.startTrial)} line={trialLine} size="lg" onStart={startTrial} />
        </footer>
      )}
    </div>
  );
}

/** The trial's caps as `TrialCaps` takes them (`BM-41`). */
function trialCaps(view: PricingView) {
  return {
    designPower: view.trialDesignPower,
    proposals: view.trial.proposalsPerMonth,
    voiceMinutes: view.trial.voiceMinutes,
    storageGb: view.trial.storageGb,
  };
}

/** The plans region's foot: the price list's name and date, and the tax line once registered. */
function ListFoot({ view, source }: { view: PricingView; source: string }) {
  const t = useTranslate();
  return (
    <div className="hg-pricing-sources hg-pricing-sources--row">
      <Provenance tier="unmarked" source={source} />
      {view.taxExcluded ? (
        <Provenance note={t(PRICING.pricesExclude, { scheme: view.taxScheme })} />
      ) : null}
    </div>
  );
}
