import type { ProposalFieldSetWire } from '@heliogrid/contracts';
import { basisPointsToPercent, PROPOSAL_LIMITS } from '@heliogrid/domain';
import {
  amountWire,
  editDeal,
  editStep,
  percentWire,
  type StepContext,
  savesOf,
  typedOf,
} from './proposal-builder-context';
import type { BatteryModel, SystemStepModel } from './proposal-builder-model';

type System = ProposalFieldSetWire['system'];

/** The queue keys step 3's fields save under; two fields of one control share a key. */
const KEYS = {
  capacity: 'system.capacity',
  price: 'system.price',
  discount: 'system.discount',
  sanctionedLoad: 'system.sanctionedLoad',
  emiRate: 'system.emi',
  emiTenure: 'system.emi',
  ourCost: 'system.ourCost',
  batteryCapacity: 'system.battery',
  batteryCost: 'system.battery',
} as const;

function discountOf(ctx: StepContext, system: System): SystemStepModel['discount'] {
  const { discount } = system;
  if (discount === null) return { mode: ctx.acts.discountMode ?? 'amount', value: null };
  return discount.mode === 'percent'
    ? { mode: 'percent', value: Number(discount.percent) }
    : { mode: 'amount', value: Number(discount.amount) };
}

function discountWire(
  ctx: StepContext,
  typed: { mode: 'percent' | 'amount'; value: number | null },
): System['discount'] {
  if (typed.value === null || typed.value <= 0) return null;
  return typed.mode === 'percent'
    ? { mode: 'percent', percent: percentWire(typed.value) }
    : { mode: 'amount', amount: amountWire(ctx.formats, typed.value) };
}

function batteryOf(system: System): BatteryModel | null {
  const { battery } = system;
  if (battery === null) return null;
  return {
    capacityKwh: battery.capacityKwh,
    cost: typedOf(battery.costInclusive),
    chemistry: battery.chemistry,
    chemistryCustom: battery.chemistryCustom,
  };
}

function batteryWire(ctx: StepContext, stored: System, typed: BatteryModel | null) {
  if (typed === null) return null;
  return {
    capacityKwh: typed.capacityKwh,
    costInclusive: typed.cost === null ? null : amountWire(ctx.formats, typed.cost),
    /* A battery keeps the rate it was added at; a new one takes the market pack's. */
    taxPercent: stored.battery?.taxPercent ?? ctx.batteryTaxPercent ?? stored.taxPercent,
    chemistry: typed.chemistry,
    chemistryCustom: typed.chemistry === 'custom' ? typed.chemistryCustom : null,
  };
}

/** `M06-30`: off-grid with no battery cannot work; hybrid should hold one. Said at once, blocked at Generate. */
function batteryNeeded(system: System): SystemStepModel['batteryNeeded'] {
  if (system.battery !== null || system.systemType === 'on_grid') return null;
  return system.systemType === 'off_grid' ? 'danger' : 'warning';
}

function emiTypical(ctx: StepContext): SystemStepModel['emiTypical'] {
  const example = ctx.formats.proposal?.emiExample;
  return example === undefined
    ? { ratePercent: 0, tenureYears: 1 }
    : { ratePercent: Number(basisPointsToPercent(example.rate)), tenureYears: example.tenureYears };
}

/** Step 3 — the system and its price (`M06-09`, `M06-30`, `M06-35`, `M06-38`, `M06-40`, `T-M06-005`). */
export function systemStepOf(ctx: StepContext): SystemStepModel {
  const { system } = ctx.fields;
  const { money, company } = ctx.detail.document;
  const edit = (
    key: string,
    change: (stored: System) => System,
    amounts: readonly (number | null)[] = [],
  ) => editStep(ctx, key, 'system', change, amounts);
  const { seesCost } = ctx.detail.rights;
  return {
    step: 'system',
    capacityKw: system.capacityKw,
    onCapacity: (kw) =>
      edit(KEYS.capacity, (stored) => ({
        ...stored,
        capacityKw: Math.max(PROPOSAL_LIMITS.capacityKw.min, kw),
      })),
    systemType: system.systemType,
    onSystemType: (systemType) => edit('system.type', (stored) => ({ ...stored, systemType })),
    segment: ctx.deal.segment,
    onSegment: (segment) => editDeal(ctx, 'system.segment', { segment }),
    batteryNeeded: batteryNeeded(system),
    onPickBattery: () => ctx.acts.pickCategory('battery'),
    priceInclusive: typedOf(system.priceInclusive),
    onPrice: (price) =>
      edit(
        KEYS.price,
        (stored) => ({
          ...stored,
          priceInclusive: price === null ? null : amountWire(ctx.formats, price),
        }),
        [price],
      ),
    noTax: company.taxRegistration === null,
    discount: discountOf(ctx, system),
    onDiscount: (typed) => {
      ctx.acts.chooseDiscountMode(typed.mode);
      edit(KEYS.discount, (stored) => ({ ...stored, discount: discountWire(ctx, typed) }), [
        typed.mode === 'amount' ? typed.value : null,
      ]);
    },
    /* The pack's own rule, so the switch is there before a price is typed; the server's answer wins once it has one. */
    ...((money?.incentiveOffered ?? ctx.acts.incentiveOffered) === true &&
    ctx.acts.incentiveScheme !== null
      ? {
          incentive: {
            ...ctx.acts.incentiveScheme,
            claimed: system.incentiveClaimed,
            onClaimed: () => {
              const incentiveClaimed = ctx.flipped('system.incentive', system.incentiveClaimed);
              edit('system.incentive', (stored) => ({ ...stored, incentiveClaimed }));
            },
          },
        }
      : {}),
    sanctionedLoadKw: ctx.deal.sanctionedLoadKw,
    onSanctionedLoad: (sanctionedLoadKw) =>
      editDeal(ctx, KEYS.sanctionedLoad, { sanctionedLoadKw }),
    supplyPhase: ctx.deal.supplyPhase,
    onSupplyPhase: (supplyPhase) => editDeal(ctx, 'system.supplyPhase', { supplyPhase }),
    maintenance:
      system.maintenance.kind === 'years'
        ? { kind: 'years', years: system.maintenance.years }
        : { kind: system.maintenance.kind, years: null },
    onMaintenance: (plan) =>
      edit('system.maintenance', (stored) => ({
        ...stored,
        maintenance:
          plan.kind === 'years'
            ? { kind: 'years', years: plan.years ?? PROPOSAL_LIMITS.maintenanceYears.min }
            : { kind: plan.kind },
      })),
    emi:
      system.emi === null
        ? null
        : { ratePercent: Number(system.emi.ratePercent), tenureYears: system.emi.tenureYears },
    onEmi: (emi) =>
      edit(KEYS.emiRate, (stored) => ({
        ...stored,
        emi:
          emi === null
            ? null
            : { ratePercent: percentWire(emi.ratePercent), tenureYears: emi.tenureYears },
      })),
    emiTypical: emiTypical(ctx),
    battery: batteryOf(system),
    onBattery: (battery) =>
      edit(
        KEYS.batteryCapacity,
        (stored) => ({ ...stored, battery: batteryWire(ctx, stored, battery) }),
        [battery?.cost ?? null],
      ),
    ...(seesCost
      ? {
          ourCost: {
            value: typedOf(system.ourCost),
            onCost: (cost: number | null) =>
              edit(
                KEYS.ourCost,
                (stored) => ({
                  ...stored,
                  ourCost: cost === null ? null : amountWire(ctx.formats, cost),
                }),
                [cost],
              ),
          },
        }
      : {}),
    saves: savesOf(ctx, KEYS),
  };
}
