import { Text } from '../../primitives/Text/Text';
import { Accordion } from '../Accordion';
import { ShellGlyph } from '../AppShell';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Block } from '../Block';
import { Button } from '../Button';
import { Explainer } from '../Explainer';
import { FactRow, FactRows } from '../FactRow';
import { HeroPanel } from '../HeroPanel';
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

/**
 * `Your plan`, the page's one hero: the plan's name large, its chip and where it comes from, then
 * the facts, the next bill's working, the one way to change it, and what it includes.
 */
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
  const [named, ...facts] = plan.rows;
  return (
    <HeroPanel
      label={words.yourPlan}
      labelAside={
        <>
          <BillingChipMark chip={plan.chip} />
          {plan.source === null ? null : <Provenance source={plan.source} size={12} />}
        </>
      }
    >
      {named === undefined ? null : (
        <p className="hg-billing-hero-name">
          <BillingValueText value={named.value} />
        </p>
      )}
      <div className="hg-billing-stack" data-gap="3">
        {facts.length > 0 ? <BillingPairs label={words.yourPlan} facts={facts} /> : null}
        {plan.scope === null ? null : (
          <ScopeNote title={plan.scope.title} variant="line" size={13} />
        )}
        {plan.working === null ? null : (
          <BillingWorking working={plan.working} words={words} defaultOpen />
        )}
        {plan.route === null ? null : (
          <div className="hg-billing-hero-route">
            <Button variant="primary" size="md" onClick={onRoute} disabled={onRoute === undefined}>
              {plan.route.title}
            </Button>
            {plan.route.subtitle === null ? null : (
              <Text variant="body-sm" color="secondary">
                {plan.route.subtitle}
              </Text>
            )}
          </div>
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
    </HeroPanel>
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
