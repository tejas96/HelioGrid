import type { BillingCycle, Tier } from '@heliogrid/domain';
import { ShellGlyph } from '../AppShell';
import { BillingValueText } from '../BillingHome/BillingValue';
import { Block } from '../Block';
import { Button } from '../Button';
import { Card } from '../Card';
import { Chip } from '../Chip';
import { FilterChips } from '../FilterBar';
import { ListRow } from '../ListRow';
import { LoadingBars } from '../LoadingBars';
import { OptionCardGroup, type OptionCardItem } from '../OptionCardGroup';
import { PlanCard } from '../PlanCard';
import { Provenance } from '../Provenance';
import { ScopeNote } from '../ScopeNote';
import type {
  PlanCardView,
  PlanEnterpriseView,
  PlanPickView,
  PlanReadOnlyView,
  PlanSelectionProps,
} from './PlanSelection.types';

/** The plans region: its loading or failure, the Owner's pick, or a member's read-only cards. */
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
  if (view.plans.kind === 'readonly') {
    return <ReadOnlyPlans plans={view.plans} scope={view.scope} {...props} />;
  }
  return <PickPlans plans={view.plans} {...props} />;
}

function PickPlans({
  plans,
  words,
  layout,
  acting,
  acts,
}: PlanSelectionProps & { plans: PlanPickView }) {
  const wide = layout === 'columns';
  const tierOf = (value: string) => plans.cards.find((card) => card.tier === value)?.tier;
  const cycleOf = (value: string) => plans.cycles.find((choice) => choice.value === value)?.value;
  return (
    <div className="hg-plans-region">
      <div className="hg-plans-chips">
        <span className="hg-plans-chips-label">{words.billingCycle}</span>
        <FilterChips
          label={words.billingCycle}
          value={plans.cycle}
          onChange={(value) => {
            const cycle: BillingCycle | undefined = cycleOf(value);
            if (cycle !== undefined && !acting) acts.onCycle(cycle);
          }}
          options={plans.cycles.map((choice) => ({ value: choice.value, label: choice.label }))}
        />
      </div>
      <div className="hg-plans-cards" data-layout={layout}>
        <div className="hg-plans-cards-bought">
          <OptionCardGroup
            label={words.choosePlan}
            density="expressive"
            columns={wide ? plans.cards.length : 1}
            currentLabel={words.yourPlan}
            disabled={acting}
            value={plans.picked ?? undefined}
            onChange={(value) => {
              const tier: Tier | undefined = tierOf(value);
              if (tier !== undefined) acts.onPick(tier);
            }}
            options={plans.cards.map((card) => optionOf(card, words.yourPlan, wide))}
          />
        </div>
        {wide && plans.enterprise !== null ? (
          <EnterpriseCard
            enterprise={plans.enterprise}
            words={words}
            onSales={acts.onTalkToSales}
          />
        ) : null}
      </div>
      <div className="hg-plans-act">
        <Button
          variant="primary"
          size="lg"
          fullWidth={!wide}
          disabled={plans.reason !== null || acting}
          disabledReason={plans.reason ?? undefined}
          onClick={acts.onReview}
        >
          {words.reviewChange}
        </Button>
      </div>
      {!wide && plans.enterprise !== null ? (
        <EnterpriseRow enterprise={plans.enterprise} words={words} onSales={acts.onTalkToSales} />
      ) : null}
      {plans.source === null ? null : (
        <div className="hg-plans-sources">
          <Provenance source={plans.source} size={12} />
          {plans.sourceNote === null ? null : <Provenance note={plans.sourceNote} size={12} />}
        </div>
      )}
    </div>
  );
}

/** One plan as a radio card: at 1536 its relation chip sits under the title (decision 7). */
function optionOf(
  card: PlanCardView,
  yourPlan: PlanSelectionProps['words']['yourPlan'],
  wide: boolean,
): OptionCardItem {
  const body = (
    <PlanCard
      form="card"
      name={card.name}
      figure={card.figure}
      gap={card.gap}
      note={null}
      lines={card.lines}
    />
  );
  const relation = card.current ? yourPlan : card.relation;
  if (wide) {
    return {
      value: card.tier,
      title: card.name,
      disabled: card.figure === null,
      content: (
        <span className="hg-plans-card-body">
          {relation === null ? null : (
            <span className="hg-plans-card-chip">
              <Chip density="expressive">{relation}</Chip>
            </span>
          )}
          {body}
        </span>
      ),
    };
  }
  return {
    value: card.tier,
    title: card.name,
    current: card.current,
    disabled: card.figure === null,
    marks: card.relation === null ? undefined : <Chip density="expressive">{card.relation}</Chip>,
    content: body,
  };
}

interface EnterpriseProps {
  enterprise: PlanEnterpriseView;
  words: PlanSelectionProps['words'];
  onSales: () => void;
}

function SalesButton({
  words,
  onSales,
  size,
}: Omit<EnterpriseProps, 'enterprise'> & { size: 'sm' }) {
  return (
    <Button
      size={size}
      variant="secondary"
      icon={<ShellGlyph name="phone" size="sm" />}
      onClick={onSales}
    >
      {words.talkToSales}
    </Button>
  );
}

/** Enterprise at 375: a row under the cards, outside the radiogroup (decision 2). */
function EnterpriseRow({ enterprise, words, onSales }: EnterpriseProps) {
  return (
    <ListRow
      className="hg-plans-rest"
      density="expressive"
      icon={<ShellGlyph name="building" tone="secondary" />}
      title={enterprise.name}
      subtitle={enterprise.from === null ? undefined : <BillingValueText value={enterprise.from} />}
      gap={enterprise.gap ?? undefined}
      marks={
        enterprise.chip === null ? undefined : <Chip density="expressive">{enterprise.chip}</Chip>
      }
      trailing={
        enterprise.sales ? <SalesButton words={words} onSales={onSales} size="sm" /> : undefined
      }
    />
  );
}

/** Enterprise at 1536: the fourth column's card, `Talk to sales` inside it (decision 7). */
function EnterpriseCard({ enterprise, words, onSales }: EnterpriseProps) {
  return (
    <div className="hg-plans-enterprise">
      <span className="hg-plans-chips-label">{words.pricedWithYou}</span>
      <Card density="expressive">
        <span className="hg-plans-card-body">
          <span className="hg-plans-card-name">{enterprise.name}</span>
          {enterprise.chip === null ? null : (
            <span className="hg-plans-card-chip">
              <Chip density="expressive">{enterprise.chip}</Chip>
            </span>
          )}
          <PlanCard
            form="card"
            name={enterprise.name}
            figure={enterprise.figure}
            gap={enterprise.gap}
            note={null}
            lines={enterprise.lines}
          />
          {enterprise.sales ? (
            <span className="hg-plans-card-chip">
              <SalesButton words={words} onSales={onSales} size="sm" />
            </span>
          ) : null}
        </span>
      </Card>
    </div>
  );
}

/** Not the Owner (frame s10): every plan and which one is theirs, then whose act it is. */
function ReadOnlyPlans({
  plans,
  scope,
  words,
  layout,
}: PlanSelectionProps & { plans: PlanReadOnlyView; scope: PlanSelectionProps['view']['scope'] }) {
  return (
    <div className="hg-plans-region">
      <div className="hg-plans-chips">
        <span className="hg-plans-chips-label">{words.plans}</span>
        <div className="hg-plans-readonly" data-layout={layout}>
          {plans.cards.map((card) => (
            <Card key={card.key} density="expressive">
              <span className="hg-plans-readonly-card" data-layout={layout}>
                <span className="hg-plans-card-name">{card.name}</span>
                {card.word === null ? null : <Chip density="expressive">{card.word}</Chip>}
              </span>
            </Card>
          ))}
        </div>
      </div>
      {scope === null ? null : <ScopeNote title={scope} variant="line" size={13} />}
    </div>
  );
}
