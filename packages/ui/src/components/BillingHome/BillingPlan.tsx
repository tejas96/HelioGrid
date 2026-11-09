import { Text } from '../../primitives/Text/Text';
import { Accordion } from '../Accordion';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Block } from '../Block';
import { Button } from '../Button';
import { Explainer } from '../Explainer';
import { FactRow, FactRows } from '../FactRow';
import { HeroPanel } from '../HeroPanel';
import { ProgressRing } from '../ProgressRing';
import { Provenance } from '../Provenance';
import { ScopeNote } from '../ScopeNote';
import type {
  BillingBodyActing,
  BillingFact,
  BillingHomeWords,
  BillingMethodView,
  BillingPlanView,
} from './BillingHome.types';
import { BillingChipMark, BillingWorking } from './BillingNeeds';
import { BillingPairs } from './BillingPairs';
import { BillingQuiet } from './BillingQuiet';

/**
 * `Your plan`, the page's one hero: the plan's name large with its few facts, the ring of days left
 * beside it, the next bill's working, the one way to change it, and what it includes opened in
 * place. The ring speaks the days left, so its fact is not printed twice.
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
  const [named, ...rest] = plan.rows;
  const facts = plan.countdown === null ? rest : rest.filter((fact) => fact.key !== 'left');
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
      <div className="hg-billing-hero-top">
        <div className="hg-billing-hero-lead">
          {named === undefined ? null : (
            <p className="hg-billing-hero-name">
              <BillingValueText value={named.value} />
            </p>
          )}
          {facts.length > 0 ? <HeroFacts facts={facts} /> : null}
        </div>
        {plan.countdown === null ? null : (
          <ProgressRing
            share={plan.countdown.share}
            value={plan.countdown.figure}
            caption={plan.countdown.caption}
            spokenName={plan.countdown.spoken}
            onPanel
          />
        )}
      </div>
      <div className="hg-billing-stack" data-gap="4">
        {plan.scope === null ? null : (
          <ScopeNote title={plan.scope.title} variant="line" size={13} />
        )}
        {plan.working === null ? null : (
          <BillingWorking working={plan.working} words={words} defaultOpen />
        )}
        {plan.route === null ? null : (
          <div className="hg-billing-hero-route">
            <Button variant="primary" size="lg" onClick={onRoute} disabled={onRoute === undefined}>
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

/** The plan's few facts under its name: a quiet label, its value strong; the price as a figure. */
function HeroFacts({ facts }: { facts: readonly BillingFact[] }) {
  return (
    <dl className="hg-billing-hero-facts">
      {facts.map((fact) => (
        <div key={fact.key} className="hg-billing-hero-fact" data-key={fact.key}>
          {/* A price under the name is read as the figure it is; its label is still spoken. */}
          <dt className={fact.key === 'price' ? 'hg-spoken-only' : undefined}>{fact.label}</dt>
          <dd>
            <BillingValueText value={fact.value} />
            {fact.under === null ? null : (
              <span className="hg-billing-hero-under">
                <BillingValueText value={fact.under} />
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
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
          <BillingQuiet art="card" title={method.gap ?? words.method} message={null} />
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
