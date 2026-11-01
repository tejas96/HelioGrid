import { Accordion } from '../Accordion';
import { ShellGlyph } from '../AppShell';
import { Block } from '../Block';
import { Button } from '../Button';
import { Explainer } from '../Explainer';
import { FactRow, FactRows } from '../FactRow';
import { ListRow } from '../ListRow';
import { Provenance } from '../Provenance';
import { ScopeNote } from '../ScopeNote';
import { UsageMeter } from '../UsageMeter';
import type {
  BillingBodyActing,
  BillingHomeWords,
  BillingMethodView,
  BillingPlanView,
  BillingUsageView,
} from './BillingHome.types';
import { BillingChipMark, BillingWorking } from './BillingNeeds';
import { BillingPairs } from './BillingPairs';

const CHEVRON = <ShellGlyph name="chevron-right" />;

/** `Your plan` (`SCR-M12-03`'s block): the pairs, the next bill's working, the route, the includes. */
export function BillingPlan({
  plan,
  words,
  onRoute,
}: {
  plan: BillingPlanView;
  words: BillingHomeWords;
  /** Absent while another act's answer is out: the route waits. */
  onRoute: (() => void) | undefined;
}) {
  return (
    <Block
      title={words.yourPlan}
      density="expressive"
      badge={<BillingChipMark chip={plan.chip} />}
      provenance={plan.source === null ? undefined : { source: plan.source }}
    >
      <div className="hg-billing-stack" data-gap="3">
        {plan.rows.length > 0 ? <BillingPairs label={words.yourPlan} facts={plan.rows} /> : null}
        {plan.scope === null ? null : (
          <ScopeNote title={plan.scope.title} variant="line" size={13} />
        )}
        {plan.working === null ? null : (
          <BillingWorking working={plan.working} words={words} defaultOpen />
        )}
        {plan.route === null ? null : (
          <ListRow
            className="hg-billing-flush"
            density="functional"
            title={plan.route.title}
            subtitle={plan.route.subtitle ?? undefined}
            trailing={CHEVRON}
            onClick={onRoute}
          />
        )}
        {plan.includes === null ? null : (
          <Accordion
            density="functional"
            items={[
              {
                key: 'includes',
                title: words.whatMyPlanIncludes,
                content: <BillingPairs label={words.whatMyPlanIncludes} facts={plan.includes} />,
              },
            ]}
          />
        )}
      </div>
    </Block>
  );
}

/** `Usage this cycle`: `SCR-M12-04`'s meters nearest their limits, the route, two source lines. */
export function BillingUsage({
  usage,
  words,
  onAllUsage,
}: {
  usage: BillingUsageView;
  words: BillingHomeWords;
  /** Absent while another act's answer is out: the route waits. */
  onAllUsage: (() => void) | undefined;
}) {
  return (
    <Block
      title={words.usageThisCycle}
      density="expressive"
      footer={
        <span className="hg-billing-sources">
          {usage.sources.map((source) => (
            <Provenance key={source} source={source} size={12} />
          ))}
        </span>
      }
    >
      <div className="hg-billing-stack" data-gap="5">
        {usage.meters.map((meter) => (
          <UsageMeter
            key={meter.key}
            density="expressive"
            label={meter.label}
            words={words.usageMeter}
            value={meter.value}
            limit={meter.limit}
            unit={meter.unit ?? undefined}
          />
        ))}
        <ListRow
          className="hg-billing-flush"
          density="functional"
          title={words.allUsage}
          trailing={CHEVRON}
          onClick={onAllUsage}
        />
      </div>
    </Block>
  );
}

/** `Payment method`: the method as the gateway names it, never an instrument detail (`M12-10`). */
export function BillingMethod({
  method,
  words,
  pending,
  onUpdate,
}: {
  method: BillingMethodView;
  words: BillingHomeWords;
  pending: BillingBodyActing;
  onUpdate: () => void;
}) {
  return (
    <Block
      title={words.paymentMethod}
      density="expressive"
      badge={method.chip === null ? undefined : <BillingChipMark chip={method.chip} />}
      action={
        <Explainer
          label={words.aboutMethod}
          title={words.aboutMethodTitle}
          placement="bottom"
          inset
          pages={words.aboutMethodBody}
        />
      }
    >
      <div className="hg-billing-stack" data-gap="3">
        {method.value === null ? (
          <FactRows label={words.paymentMethod} density="expressive" form="lead">
            <FactRow
              label={words.method}
              gap={method.gap === null ? undefined : { gap: method.gap, scale: 'field' }}
            />
          </FactRows>
        ) : (
          <FactRows
            className="hg-billing-pairs"
            label={words.paymentMethod}
            density="expressive"
            form="pair"
          >
            <FactRow
              label={words.method}
              value={<span className="hg-billing-fact-value">{method.value}</span>}
            />
          </FactRows>
        )}
        {method.canUpdate ? (
          <div className="hg-billing-start">
            <Button
              variant="secondary"
              size="md"
              loading={pending === 'method'}
              disabled={pending !== null}
              onClick={onUpdate}
            >
              {words.update}
            </Button>
          </div>
        ) : null}
      </div>
    </Block>
  );
}
