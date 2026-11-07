import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Accordion } from '../Accordion/Accordion.native';
import { BillingValueText, workingParts } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Derivation } from '../Derivation/Derivation.native';
import { Explainer } from '../Explainer/Explainer.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { ProgressRing } from '../ProgressRing/ProgressRing.native';
import { Provenance } from '../Provenance/Provenance.native';
import { ScopeNote } from '../ScopeNote/ScopeNote.native';
import type {
  BillingBodyActing,
  BillingFact,
  BillingHomeProps,
  BillingMethodView,
  BillingPlanView,
} from './BillingHome.types';
import { plain } from './BillingHome.values';
import { BillingStatusChip } from './BillingNeeds.native';
import { BillingQuiet } from './BillingQuiet.native';

type Words = BillingHomeProps['words'];

/** A fact's value on the right edge; `Next bill`'s amount on its own line under the date. */
function FactValue({ fact }: { fact: BillingFact }) {
  if (fact.under === null) return <BillingValueText value={fact.value} />;
  return (
    <View style={styles.stacked}>
      <BillingValueText value={fact.value} />
      <BillingValueText value={fact.under} />
    </View>
  );
}

function Facts({ label, facts }: { label: BillingFact['label']; facts: readonly BillingFact[] }) {
  return (
    <FactRows label={label} density="expressive" form="pair">
      {facts.map((fact) => (
        <FactRow key={fact.key} label={fact.label} value={<FactValue fact={fact} />} />
      ))}
    </FactRows>
  );
}

/** The plan's few facts under its name: a quiet label, its value strong; a price as the hero's figure. */
function HeroFacts({ facts }: { facts: readonly BillingFact[] }) {
  return (
    <View style={styles.heroFacts}>
      {facts.map((fact) =>
        fact.key === 'price' ? (
          <Text key={fact.key} variant="figure">
            {fact.value.map((run) => run.text).join('')}
          </Text>
        ) : (
          <View key={fact.key} style={styles.heroFact}>
            <Text variant="body-sm" color="secondary">
              {fact.label}
            </Text>
            <FactValue fact={fact} />
          </View>
        ),
      )}
    </View>
  );
}

/**
 * SCR-M12-03's `Your plan`, the page's one hero: the name and its few facts beside the ring of days
 * left, the next bill's working, the one way to change it, and what it includes. The ring speaks
 * the days left, so its fact is not printed twice.
 */
export function BillingPlan({
  plan,
  words,
  onRoute,
}: {
  plan: BillingPlanView;
  words: Words;
  onRoute: (() => void) | undefined;
}) {
  const [named, ...rest] = plan.rows;
  const facts = plan.countdown === null ? rest : rest.filter((fact) => fact.key !== 'left');
  return (
    <HeroPanel
      label={words.yourPlan}
      labelAside={
        <>
          <BillingStatusChip chip={plan.chip} />
          {plan.source === null ? null : <Provenance source={plan.source} size={12} />}
        </>
      }
    >
      <View style={styles.heroTop}>
        <View style={styles.heroLead}>
          {named === undefined ? null : (
            /* The plan's name is what the hero is about: the phone's hero size, as the web's. */
            <Text variant="hero">{named.value.map((run) => run.text).join('')}</Text>
          )}
          {facts.length === 0 ? null : <HeroFacts facts={facts} />}
        </View>
        {plan.countdown === null ? null : (
          <ProgressRing
            share={plan.countdown.share}
            value={plan.countdown.figure}
            caption={plan.countdown.caption}
            spokenName={plan.countdown.spoken}
            onPanel
          />
        )}
      </View>
      <View style={styles.region}>
        {plan.scope === null ? null : (
          <ScopeNote title={plan.scope.title} variant="line" size={13} />
        )}
        {plan.working === null ? null : (
          <Derivation
            summary={words.howWorkedOut}
            label={plan.working.label}
            parts={workingParts(plan.working.parts)}
            kindWords={words.derivationKinds}
            defaultOpen
          />
        )}
        {plan.route === null ? null : (
          <View style={styles.route}>
            <Button variant="primary" size="lg" onClick={onRoute} disabled={onRoute === undefined}>
              {plan.route.title}
            </Button>
            {plan.route.subtitle === null ? null : (
              <Text variant="body-sm" color="secondary">
                {plan.route.subtitle}
              </Text>
            )}
          </View>
        )}
        {plan.includes === null ? null : (
          <Accordion
            density="functional"
            items={[
              {
                key: 'includes',
                title: words.whatMyPlanIncludes,
                content: <Facts label={words.whatMyPlanIncludes} facts={plan.includes} />,
              },
            ]}
          />
        )}
      </View>
    </HeroPanel>
  );
}

/** The method as the gateway names it — never an instrument detail — and its one act. */
export function BillingMethod({
  method,
  words,
  pending,
  onUpdate,
}: {
  method: BillingMethodView;
  words: Words;
  pending: BillingBodyActing;
  onUpdate: () => void;
}) {
  return (
    <Block
      style={styles.flushRegion}
      density="expressive"
      title={words.paymentMethod}
      {...(method.chip === null ? {} : { badge: <BillingStatusChip chip={method.chip} /> })}
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
      <View style={styles.region}>
        {method.value === null ? (
          <BillingQuiet art="card" title={method.gap ?? words.method} message={null} />
        ) : (
          <FactRows label={words.paymentMethod} density="expressive" form="pair">
            <FactRow
              label={words.method}
              value={<BillingValueText value={plain(method.value)} />}
            />
          </FactRows>
        )}
        {method.canUpdate ? (
          <View style={styles.start}>
            <Button
              variant="secondary"
              size="md"
              loading={pending === 'method'}
              disabled={pending !== null && pending !== 'method'}
              onClick={onUpdate}
            >
              {words.update}
            </Button>
          </View>
        ) : null}
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  /* A region under the hero stands on the page's own edges, as the web's does. */
  flushRegion: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: theme.spacing['sp-2'] },
  region: { gap: theme.spacing['sp-3'] },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-4'],
  },
  heroLead: { flex: 1, minWidth: 0, gap: theme.spacing['sp-3'] },
  heroFacts: { gap: theme.spacing['sp-1'] },
  heroFact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
  },
  sources: { gap: theme.spacing['sp-0-5'] },
  stacked: { alignItems: 'flex-end', gap: theme.spacing['sp-0-5'] },
  start: { flexDirection: 'row' },
  route: { alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
});
