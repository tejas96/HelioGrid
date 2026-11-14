import type { ProposalFieldSetWire } from '@heliogrid/contracts';
import {
  areaOf,
  type ComponentCategory,
  MANDATORY_COMPONENT_CATEGORIES,
  MONTHS_PER_YEAR,
  type ProposalStep,
  sameContent,
} from '@heliogrid/domain';
import {
  amountWire,
  editDeal,
  editStep,
  percentWire,
  type StepContext,
  saveOf,
  savesOf,
  typedOf,
} from './proposal-builder-context';
import type {
  BuilderStepModel,
  ComponentsStepModel,
  FinancialsStepModel,
  PaymentStepModel,
  PerformanceStepModel,
  TermsStepModel,
  TimelineStepModel,
} from './proposal-builder-model';
import {
  bankStepOf,
  clientStepOf,
  companyStepOf,
  trackRecordStepOf,
} from './proposal-builder-steps-facts';
import { systemStepOf } from './proposal-builder-system-step';

type Wire = ProposalFieldSetWire;
const WHOLE = 100;

function fillOf(ctx: StepContext): PerformanceStepModel['fill'] {
  if (ctx.acts.energyState?.kind === 'saving') return 'filling';
  const { source } = ctx.fields.performance;
  if (source === null) return 'none';
  return source.kind === 'record' ? 'source' : 'built_in';
}

/** The place a fill is asked for: the picked district, else its state's name in the pack. */
function placeOf(ctx: StepContext): string | null {
  const { area } = ctx.deal;
  if (area === null) return null;
  return area.district ?? areaOf(ctx.formats.areas, area.area)?.name.en ?? null;
}

function performanceStepOf(ctx: StepContext): PerformanceStepModel {
  const { performance } = ctx.fields;
  const { generation } = ctx.detail.document;
  const shown = performance.editedMonthlyKwh ?? generation?.monthlyKwh ?? null;
  const edit = (
    key: string,
    change: (stored: Wire['performance'], all: Wire) => Wire['performance'],
  ) => editStep(ctx, key, 'performance', change);
  return {
    step: 'performance',
    fill: fillOf(ctx),
    fillWants: {
      size: ctx.fields.system.capacityKw === null,
      state: ctx.deal.area === null,
      refused: ctx.acts.energyState?.kind === 'refused',
    },
    asked: { place: placeOf(ctx), capacityKw: ctx.fields.system.capacityKw },
    onRefill: ctx.acts.refill,
    capacityChanged: generation?.capacityChangedSinceEdit ?? false,
    efficiencyPercent: performance.efficiencyPercent,
    onEfficiency: (efficiencyPercent) =>
      edit('performance.efficiency', (stored) => ({ ...stored, efficiencyPercent })),
    monthlyKwh: shown,
    onMonth: (month, kwh) => {
      if (shown === null || shown.length !== MONTHS_PER_YEAR) return;
      edit('performance.months', (stored, all) => ({
        ...stored,
        editedMonthlyKwh: (stored.editedMonthlyKwh ?? shown).map((value, at) =>
          at === month ? Math.max(0, kwh) : value,
        ),
        editedAtCapacityKw: all.system.capacityKw,
      }));
    },
    saves: savesOf(ctx, { efficiency: 'performance.efficiency', months: 'performance.months' }),
  };
}

function financialsStepOf(ctx: StepContext): FinancialsStepModel {
  const { financials } = ctx.fields;
  const edit = (
    key: string,
    change: (stored: Wire['financials']) => Wire['financials'],
    amounts: readonly (number | null)[] = [],
  ) => editStep(ctx, key, 'financials', change, amounts);
  return {
    step: 'financials',
    monthlyBill: typedOf(ctx.deal.monthlyBill),
    /* The lead's own bill, carried from the lead and saved back on it (`T-M06-005`, `M02-05`). */
    onMonthlyBill: (bill) =>
      editDeal(
        ctx,
        'financials.bill',
        { monthlyBill: bill === null ? null : amountWire(ctx.formats, bill) },
        [bill],
      ),
    tariffPerKwh: typedOf(financials.tariffPerKwh),
    onTariff: (tariff) =>
      edit(
        'financials.tariff',
        (stored) => ({
          ...stored,
          tariffPerKwh: tariff === null ? null : amountWire(ctx.formats, tariff),
        }),
        [tariff],
      ),
    tariffRisePercent: Number(financials.tariffRisePercent),
    onTariffRise: (percent) =>
      edit('financials.tariffRise', (stored) => ({
        ...stored,
        tariffRisePercent: percentWire(percent),
      })),
    horizonYears: financials.horizonYears,
    /* `T-M06-007`: a horizon that is zero, negative or not a number is refused where it is typed. */
    onHorizon: (years) => {
      if (!Number.isInteger(years) || years <= 0) return;
      edit('financials.horizon', (stored) => ({ ...stored, horizonYears: years }));
    },
    saves: savesOf(ctx, {
      monthlyBill: 'financials.bill',
      tariff: 'financials.tariff',
      tariffRise: 'financials.tariffRise',
      horizon: 'financials.horizon',
    }),
  };
}

function timelineStepOf(ctx: StepContext): TimelineStepModel {
  const edit = (change: (stored: Wire['timeline']) => Wire['timeline']) =>
    editStep(ctx, 'timeline.rows', 'timeline', change);
  return {
    step: 'timeline',
    phases: ctx.fields.timeline,
    onMove: (index, by) =>
      edit((stored) => {
        const to = index + by;
        const moved = stored[index];
        const other = stored[to];
        if (moved === undefined || other === undefined) return stored;
        return stored.map((phase, at) => (at === index ? other : at === to ? moved : phase));
      }),
    onRemove: (index) => edit((stored) => stored.filter((_, at) => at !== index)),
    onEdit: ctx.acts.editPhase,
    onAdd: ctx.acts.addPhase,
    onReset: () => ctx.acts.resetStep('timeline'),
  };
}

function paymentStepOf(ctx: StepContext): PaymentStepModel {
  const { payment } = ctx.fields;
  const plans = ctx.detail.paymentPlans;
  const edit = (change: (stored: Wire['payment']) => Wire['payment']) =>
    editStep(ctx, 'payment.rows', 'payment', change);
  /* A row changed by hand no longer follows a plan: the rows are this proposal's alone (`M06-13`). */
  const own = (tranches: Wire['payment']['tranches']) => ({ templateId: null, tranches });
  const removable = payment.tranches.length > 1;
  return {
    step: 'payment',
    plans: plans.map(({ id, name }) => ({ id, name })),
    planId: payment.templateId,
    onPlan: (id) => {
      const plan = plans.find((one) => one.id === id);
      if (plan !== undefined) edit(() => ({ templateId: id, tranches: plan.lines }));
    },
    parts: payment.tranches.map((tranche, index) => ({
      key: String(index),
      label: tranche.label,
      dueOnStage: tranche.dueOnStage,
      percent: Number(tranche.percent),
    })),
    onShare: (index, percent) =>
      edit((stored) =>
        own(
          stored.tranches.map((tranche, at) =>
            at === index
              ? { ...tranche, percent: percentWire(Math.min(WHOLE, Math.max(0, percent))) }
              : tranche,
          ),
        ),
      ),
    ...(removable
      ? {
          onRemove: (index: number) =>
            edit((stored) => own(stored.tranches.filter((_, at) => at !== index))),
        }
      : {}),
    onOpen: ctx.acts.editPart,
    onAdd: ctx.acts.addPart,
    onReset: () => ctx.acts.resetStep('payment'),
  };
}

function componentsStepOf(ctx: StepContext): ComponentsStepModel {
  const categories: readonly ComponentCategory[] =
    ctx.fields.system.battery === null
      ? MANDATORY_COMPONENT_CATEGORIES
      : [...MANDATORY_COMPONENT_CATEGORIES, 'battery'];
  const held = categories.filter((category) =>
    ctx.fields.components.some((line) => line.category === category),
  );
  return {
    step: 'components',
    picked: held.length,
    required: categories.length,
    categories,
    onPick: ctx.acts.pickCategory,
    saves: savesOf(ctx, { components: 'components.rows' }),
  };
}

function termsStepOf(ctx: StepContext): TermsStepModel {
  const save = saveOf(ctx, 'terms.text');
  const terms = ctx.acts.termsTyped ?? ctx.fields.terms;
  const asDefault = ctx.acts.termsDefault;
  return {
    step: 'terms',
    terms,
    onChange: ctx.acts.typeTerms,
    onCommit: (typed) => editStep(ctx, 'terms.text', 'terms', () => typed),
    ...(asDefault === null ? {} : { onSaveAsDefault: () => asDefault.save(terms) }),
    savingDefault: asDefault?.saving ?? false,
    defaultSaved: asDefault?.saved != null && sameContent(asDefault.saved, terms),
    defaultFailure: asDefault?.failure ?? null,
    printsIn: ctx.detail.termsPrintIn,
    saves: save === undefined ? {} : { terms: save },
  };
}

const STEP_MODEL: Readonly<Record<ProposalStep, (ctx: StepContext) => BuilderStepModel>> = {
  company: companyStepOf,
  achievements: trackRecordStepOf,
  system: systemStepOf,
  performance: performanceStepOf,
  financials: financialsStepOf,
  timeline: timelineStepOf,
  payment: paymentStepOf,
  components: componentsStepOf,
  terms: termsStepOf,
  client: clientStepOf,
  bank: bankStepOf,
};

/** One step's model over the draft as it stands. */
export function stepModelOf(step: ProposalStep, ctx: StepContext): BuilderStepModel {
  return STEP_MODEL[step](ctx);
}
