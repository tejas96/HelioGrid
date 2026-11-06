import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Accordion } from '../Accordion/Accordion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { BillingValueText, workingParts } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Derivation } from '../Derivation/Derivation.native';
import { Explainer } from '../Explainer/Explainer.native';
import { FactRow } from '../FactRow/FactRow.native';
import { FactRows } from '../FactRow/FactRows.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { ListRow } from '../ListRow/ListRow.native';
import { Provenance } from '../Provenance/Provenance.native';
import { ScopeNote } from '../ScopeNote/ScopeNote.native';
import { UsageMeter } from '../UsageMeter/UsageMeter.native';
import type {
  BillingBodyActing,
  BillingFact,
  BillingHomeProps,
  BillingMethodView,
  BillingPlanView,
  BillingUsageView,
} from './BillingHome.types';
import { plain } from './BillingHome.values';
import { BillingStatusChip } from './BillingNeeds.native';

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

/** A route row inside a region sits on the region's edges, its chevron on the right edge. */
const CHEVRON = <ShellGlyph name="chevron-right" size="md" tone="secondary" />;

/** SCR-M12-03's `Your plan`: the state as its one chip, the pairs, the route and what it includes. */
export function BillingPlan({
  plan,
  words,
  onRoute,
}: {
  plan: BillingPlanView;
  words: Words;
  onRoute: (() => void) | undefined;
}) {
  const [named, ...facts] = plan.rows;
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
      {named === undefined ? null : (
        <Text variant="display">
          <BillingValueText value={named.value} />
        </Text>
      )}
      <View style={styles.region}>
        {facts.length === 0 ? null : <Facts label={words.yourPlan} facts={facts} />}
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
            <Button variant="primary" size="md" onClick={onRoute} disabled={onRoute === undefined}>
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

/** SCR-M12-04's meters, nearest a limit first, with where the counts and the limits come from. */
export function BillingUsage({
  usage,
  words,
  onAllUsage,
}: {
  usage: BillingUsageView;
  words: Words;
  onAllUsage: (() => void) | undefined;
}) {
  return (
    <Block
      density="expressive"
      title={words.usageThisCycle}
      footer={
        <View style={styles.sources}>
          {usage.sources.map((source) => (
            <Provenance key={source} source={source} size={12} />
          ))}
        </View>
      }
    >
      <View style={styles.meters}>
        {usage.meters.map((meter) => (
          <UsageMeter
            key={meter.key}
            label={meter.label}
            words={words.usageMeter}
            value={meter.value}
            limit={meter.limit}
            {...(meter.unit === null ? {} : { unit: meter.unit })}
            density="expressive"
          />
        ))}
        <ListRow
          title={words.allUsage}
          trailing={CHEVRON}
          density="functional"
          style={styles.flush}
          {...(onAllUsage === undefined ? {} : { onClick: onAllUsage })}
        />
      </View>
    </Block>
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
        <FactRows
          label={words.paymentMethod}
          density="expressive"
          form={method.gap === null ? 'pair' : 'lead'}
        >
          <FactRow
            label={words.method}
            {...(method.value === null
              ? {}
              : { value: <BillingValueText value={plain(method.value)} /> })}
            {...(method.gap === null ? {} : { gap: { gap: method.gap, scale: 'field' } })}
          />
        </FactRows>
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
  region: { gap: theme.spacing['sp-3'] },
  meters: { gap: theme.spacing['sp-5'] },
  sources: { gap: theme.spacing['sp-0-5'] },
  stacked: { alignItems: 'flex-end', gap: theme.spacing['sp-0-5'] },
  flush: { paddingHorizontal: 0 },
  start: { flexDirection: 'row' },
  route: { alignItems: 'flex-start', gap: theme.spacing['sp-2'] },
});
