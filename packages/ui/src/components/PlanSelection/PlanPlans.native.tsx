import type { BillingCycle, Tier } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { BillingValueText } from '../BillingStrip/BillingValue.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { Chip } from '../Chip/Chip.native';
import { FilterChips } from '../FilterBar/FilterChips.native';
import { ListRow } from '../ListRow/ListRow.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import type { OptionCardItem } from '../OptionCardGroup/OptionCardGroup.types';
import { PlanCard } from '../PlanCard/PlanCard.native';
import { Provenance } from '../Provenance/Provenance.native';
import { ScopeNote } from '../ScopeNote/ScopeNote.native';
import type {
  PlanCardView,
  PlanEnterpriseView,
  PlanPickView,
  PlanReadOnlyView,
  PlanSelectionProps,
} from './PlanSelection.types';

/** The plans region (phone): its loading or failure, the Owner's pick, or a member's cards. */
export function PlanPlans(props: PlanSelectionProps) {
  const { plansRead, view, words } = props;
  if (plansRead.kind === 'loading') {
    return <LoadingBars label={words.loadingPlans} bars={['panel', 'panel', 'panel']} />;
  }
  if (plansRead.kind !== 'ready') {
    /* No price list at all is the plans' failure to load: the brief rules out an empty state. */
    return (
      <Block
        title={words.choosePlan}
        density="expressive"
        read={plansRead}
        loadingLabel={words.loadingPlans}
        emptyTitle={words.failedPlansTitle}
        unavailableTitle={words.failedPlansTitle}
        errorTitle={words.failedPlansTitle}
        errorMessage={words.failedPlansMessage}
        retryLabel={words.tryAgain}
      />
    );
  }
  if (view.plans === null) return null;
  if (view.plans.kind === 'readonly') return <ReadOnlyPlans plans={view.plans} {...props} />;
  return <PickPlans plans={view.plans} {...props} />;
}

function PickPlans({ plans, words, acting, acts }: PlanSelectionProps & { plans: PlanPickView }) {
  const tierOf = (value: string) => plans.cards.find((card) => card.tier === value)?.tier;
  const cycleOf = (value: string) => plans.cycles.find((choice) => choice.value === value)?.value;
  return (
    <View style={styles.region}>
      <View style={styles.chips}>
        <Text variant="body-sm" color="secondary" style={styles.chipsLabel}>
          {words.billingCycle}
        </Text>
        <FilterChips
          label={words.billingCycle}
          value={plans.cycle}
          onChange={(value) => {
            const cycle: BillingCycle | undefined = cycleOf(value);
            if (cycle !== undefined && !acting) acts.onCycle(cycle);
          }}
          options={plans.cycles.map((choice) => ({ value: choice.value, label: choice.label }))}
        />
      </View>
      <OptionCardGroup
        label={words.choosePlan}
        density="expressive"
        currentLabel={words.yourPlan}
        disabled={acting}
        {...(plans.picked === null ? {} : { value: plans.picked })}
        onChange={(value) => {
          const tier: Tier | undefined = tierOf(value);
          if (tier !== undefined) acts.onPick(tier);
        }}
        options={plans.cards.map(optionOf)}
      />
      <View style={styles.act}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={plans.reason !== null || acting}
          {...(plans.reason === null ? {} : { disabledReason: plans.reason })}
          onClick={acts.onReview}
        >
          {words.reviewChange}
        </Button>
      </View>
      {plans.enterprise === null ? null : (
        <EnterpriseRow enterprise={plans.enterprise} words={words} onSales={acts.onTalkToSales} />
      )}
      {plans.source === null ? null : (
        <View style={styles.sources}>
          <Provenance source={plans.source} size={12} />
          {plans.sourceNote === null ? null : <Provenance note={plans.sourceNote} size={12} />}
        </View>
      )}
    </View>
  );
}

function optionOf(card: PlanCardView): OptionCardItem {
  return {
    value: card.tier,
    title: card.name,
    current: card.current,
    disabled: card.figure === null,
    ...(card.relation === null ? {} : { marks: <Chip density="expressive">{card.relation}</Chip> }),
    content: (
      <PlanCard
        form="card"
        name={card.name}
        figure={card.figure}
        gap={card.gap}
        note={null}
        lines={card.lines}
      />
    ),
  };
}

/** Enterprise: a row under the cards, outside the radiogroup, its act a raised pill (decision 2). */
function EnterpriseRow({
  enterprise,
  words,
  onSales,
}: {
  enterprise: PlanEnterpriseView;
  words: PlanSelectionProps['words'];
  onSales: () => void;
}) {
  return (
    <ListRow
      density="expressive"
      style={styles.rest}
      icon={<ShellGlyph name="building" size="md" tone="secondary" />}
      title={enterprise.name}
      {...(enterprise.from === null
        ? {}
        : {
            subtitle: (
              <BillingValueText
                value={enterprise.from}
                variant="body-sm"
                color="secondary"
                align="start"
              />
            ),
          })}
      {...(enterprise.gap === null ? {} : { gap: enterprise.gap })}
      {...(enterprise.chip === null
        ? {}
        : { marks: <Chip density="expressive">{enterprise.chip}</Chip> })}
      {...(enterprise.sales
        ? {
            trailing: (
              <Button
                size="sm"
                variant="secondary"
                icon={<ShellGlyph name="phone" size="sm" tone="primary" />}
                onClick={onSales}
              >
                {words.talkToSales}
              </Button>
            ),
          }
        : {})}
    />
  );
}

/** Not the Owner (frame s10): every plan and which one is theirs, then whose act it is. */
function ReadOnlyPlans({ plans, view, words }: PlanSelectionProps & { plans: PlanReadOnlyView }) {
  return (
    <View style={styles.region}>
      <View style={styles.readonly}>
        <Text variant="body-sm" color="secondary" style={styles.chipsLabel}>
          {words.plans}
        </Text>
        <View style={styles.readonlyCards}>
          {plans.cards.map((card) => (
            <Card key={card.key} density="expressive">
              <View style={styles.readonlyCard}>
                <Text variant="body" bold>
                  {card.name}
                </Text>
                {card.word === null ? null : <Chip density="expressive">{card.word}</Chip>}
              </View>
            </Card>
          ))}
        </View>
      </View>
      {view.scope === null ? null : <ScopeNote title={view.scope} variant="line" size={13} />}
    </View>
  );
}

const styles = StyleSheet.create({
  region: { gap: theme.spacing['sp-5'] },
  chips: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  chipsLabel: { fontWeight: '500' },
  /* The one way on, under the cards and on the page itself, as the web's. */
  act: { alignItems: 'stretch' },
  rest: { ...tileSurface, borderRadius: theme.radius['r-tile'] },
  sources: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-3'],
    rowGap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
  readonly: { gap: theme.spacing['sp-3'] },
  /* The cards sit one tile gap apart, as every list of tiles does (frame s10). */
  readonlyCards: { gap: theme.layout['tile-gap'] },
  readonlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
});
