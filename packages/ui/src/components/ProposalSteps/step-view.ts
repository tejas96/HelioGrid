import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { FieldSave, ProposalStepView } from './ProposalSteps.types';
import type {
  ModelOf,
  ProposalStepModel,
  ProposalStepSaid,
  SaidOf,
  StepViewParts,
} from './step-view.types';

/**
 * A step's view from its model and its words (`T-M06-003`–`T-M06-013`), joined with the document's
 * value set — once, so the web and the phone draw one step from one place.
 */

const FACT_GLYPH: Readonly<Record<string, ShellGlyphName>> = {
  company: 'building',
  phone: 'phone',
  address: 'pin',
  tax: 'file-text',
};

function companyView(
  model: ModelOf<'company'>,
  said: SaidOf<'company'>,
  parts: StepViewParts,
): ProposalStepView {
  return {
    ...model,
    words: said.words,
    covers: model.covers.flatMap((cover) => {
      const name = said.covers[cover.key];
      return name === undefined ? [] : [{ ...cover, name }];
    }),
    ...(parts.peek === undefined ? {} : { peek: parts.peek }),
    facts: model.facts.flatMap((fact) => {
      const label = said.factLabels[fact.key];
      const glyph = FACT_GLYPH[fact.key];
      if (label === undefined || glyph === undefined) return [];
      const value = fact.key === 'phone' ? said.phoneText(fact.value) : fact.value;
      return [{ ...fact, value, label, glyph }];
    }),
  };
}

function systemView(
  model: ModelOf<'system'>,
  said: SaidOf<'system'>,
  parts: StepViewParts,
): ProposalStepView {
  const { batteryNeeded, onPickBattery, noTax, ...view } = model;
  const money = parts.snapshot?.money ?? null;
  return {
    ...view,
    words: said.words,
    price: money === null ? null : { money, words: parts.blocks.price },
    ...(batteryNeeded === null || said.battery === undefined
      ? {}
      : {
          batteryNotice: {
            tone: batteryNeeded,
            title: said.battery.title,
            line: said.battery.line,
            act: { label: said.battery.act, onPress: onPickBattery },
          },
        }),
    ...(noTax && said.noTax !== undefined ? { noTax: said.noTax } : {}),
  };
}

function performanceView(
  model: ModelOf<'performance'>,
  said: SaidOf<'performance'>,
  parts: StepViewParts,
): ProposalStepView {
  const { capacityChanged, ...view } = model;
  const generation = parts.snapshot?.generation ?? null;
  const notice = said.capacityChanged;
  return {
    ...view,
    words: said.words,
    generation:
      generation === null
        ? null
        : { generation, tier: parts.generationTier, words: parts.blocks.generation },
    ...(capacityChanged
      ? {
          capacityChanged: {
            title: notice.title,
            line: notice.line,
            act: { label: notice.act, onPress: model.onRefill },
          },
        }
      : {}),
  };
}

function financialsView(
  model: ModelOf<'financials'>,
  said: SaidOf<'financials'>,
  parts: StepViewParts,
): ProposalStepView {
  const { snapshot } = parts;
  const savings = snapshot?.savings ?? null;
  const money = snapshot?.money ?? null;
  return {
    ...model,
    words: said.words,
    savings:
      snapshot === null || savings === null || money === null
        ? null
        : {
            savings,
            money,
            monthlyBill: snapshot.deal.monthlyBill,
            words: parts.blocks.savings,
          },
  };
}

function paymentView(
  model: ModelOf<'payment'>,
  said: SaidOf<'payment'>,
  parts: StepViewParts,
): ProposalStepView {
  const { snapshot } = parts;
  return {
    ...model,
    words: said.words,
    split: {
      tranches: parts.fields.payment.tranches,
      amounts: snapshot?.money?.tranches ?? null,
      words: parts.blocks.split,
    },
    parts: model.parts.map(({ dueOnStage, ...part }) => ({ ...part, due: said.due(dueOnStage) })),
  };
}

function componentsView(
  model: ModelOf<'components'>,
  said: SaidOf<'components'>,
  parts: StepViewParts,
): ProposalStepView {
  const { categories, onPick, ...view } = model;
  return {
    ...view,
    words: said.words,
    parts: {
      categories,
      components: parts.fields.components,
      words: parts.parts,
      onPick,
    },
  };
}

function clientView(
  model: ModelOf<'client'>,
  said: SaidOf<'client'>,
  parts: StepViewParts,
): ProposalStepView {
  const { area, areaMissing, onArea, phone, ...view } = model;
  return {
    ...view,
    ...(phone === undefined ? {} : { phone: said.phoneText(phone) }),
    words: said.words,
    ...(parts.areas.length === 0
      ? {}
      : {
          area: {
            options: parts.areas,
            code: area?.area ?? null,
            district: area?.district ?? null,
            missing: areaMissing,
            onArea,
          },
        }),
    facts: [
      { key: 'number', glyph: 'document', label: said.number.label, value: said.number.value },
      { key: 'language', glyph: 'globe', label: said.language.label, value: said.language.value },
    ],
  };
}

function bankView(
  model: ModelOf<'bank'>,
  said: SaidOf<'bank'>,
  parts: StepViewParts,
): ProposalStepView {
  const { mayEdit: _, ...view } = model;
  const { bank } = parts;
  return {
    ...view,
    words: said.words,
    bank: bank === null ? null : { bank, notPrinted: !model.include, words: parts.blocks.bank },
  };
}

type Step = ProposalStepModel['step'];
type Join<S extends Step> = (
  model: ModelOf<S>,
  said: SaidOf<S>,
  parts: StepViewParts,
) => ProposalStepView;

const JOIN: { readonly [S in Step]: Join<S> } = {
  company: companyView,
  achievements: (model, said) => ({ ...model, words: said.words }),
  system: systemView,
  performance: performanceView,
  financials: financialsView,
  timeline: (model, said) => ({ ...model, words: said.words }),
  payment: paymentView,
  components: componentsView,
  terms: ({ printsIn: _, defaultFailure, ...view }, said, parts) => ({
    ...view,
    words: said.words,
    ...(defaultFailure === null || defaultFailure === undefined
      ? {}
      : { defaultFailure: parts.refusal?.(defaultFailure) ?? said.words.defaultFailed }),
  }),
  client: clientView,
  bank: bankView,
};

/**
 * The view of the step in view, or `null` where the words handed in are another step's — which the
 * caller draws as still loading rather than a step worded as its neighbour.
 */
export function proposalStepViewOf(
  model: ProposalStepModel,
  said: ProposalStepSaid,
  parts: StepViewParts,
): ProposalStepView | null {
  if (model.step !== said.step) return null;
  /* One step's model and that same step's words: the table's row takes exactly this pair. */
  const join = JOIN[model.step] as Join<Step>;
  return refusalsWorded(join(model, said, parts), parts);
}

/** A field the server refused says why at the field; one with no words for it reads as not saved. */
function refusalsWorded(view: ProposalStepView, parts: StepViewParts): ProposalStepView {
  if (!('saves' in view) || view.saves === undefined) return view;
  const saves: Record<string, FieldSave> = {};
  for (const [field, save] of Object.entries<FieldSave | undefined>(view.saves)) {
    if (save === undefined) continue;
    const reason = save.kind === 'refused' ? parts.refusal?.(save.failure) : undefined;
    saves[field] =
      save.kind !== 'refused'
        ? save
        : reason === undefined || reason === null
          ? { kind: 'unsaved' }
          : { kind: 'refused', reason };
  }
  return { ...view, saves } as ProposalStepView;
}

/** The market's regions as step 10's two lists offer them (`M06-09`): a code, its name, its districts. */
export function stepAreasOf(
  areas: readonly {
    readonly code: string;
    readonly name: { readonly en: string };
    readonly districts: readonly { readonly name: string }[];
  }[],
): StepViewParts['areas'] {
  return areas.map((area) => ({
    code: area.code,
    name: area.name.en,
    districts: area.districts.map((district) => district.name),
  }));
}
