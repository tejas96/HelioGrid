import {
  type DocumentDefaults,
  richTextParagraphs,
  type StandardTranche,
  standardTrancheTemplates,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

/**
 * The platform's document defaults (`M01-28`, `M01-51`, `M01-52`, `M01-54`): short, neutral, and
 * the tenant's to replace. They are catalog copy, so a new language translates them with every
 * other line; a default reads in its reader's words until the tenant saves its own, which is then
 * one value, shown as written (`F3-10`). No number lives in the terms — a validity period or a
 * price is the proposal's own fact; the splits' shares are `packages/domain`'s.
 */
const TERMS: readonly MessageRef[] = [
  /*i18n*/ {
    id: 'This proposal is valid until the date stated on it. Prices and taxes are as itemised in it.',
  },
  /*i18n*/ {
    id: 'Payment falls due in the tranches listed in the payment schedule. Work at each stage starts once the tranche for that stage is received.',
  },
  /*i18n*/ {
    id: 'The installation follows the design agreed in this proposal. A change to the design after acceptance may change the price, and a revised proposal is issued before work continues.',
  },
  /*i18n*/ {
    id: 'Equipment warranties are the manufacturers’ and are handed over at commissioning.',
  },
];

/** `M08-08`'s chain after Won, in the customer's words: one name and one sentence each. */
const PHASES: readonly { readonly name: MessageRef; readonly description: MessageRef }[] = [
  {
    name: /*i18n*/ { id: 'Material ordered' },
    description: /*i18n*/ { id: 'Panels, inverter and structure are ordered for your site.' },
  },
  {
    name: /*i18n*/ { id: 'Dispatched' },
    description: /*i18n*/ { id: 'Materials leave the warehouse for your site.' },
  },
  {
    name: /*i18n*/ { id: 'Installation' },
    description: /*i18n*/ { id: 'The structure, panels and wiring are installed on your roof.' },
  },
  {
    name: /*i18n*/ { id: 'Electrical work and metering' },
    description: /*i18n*/ { id: 'The inverter is connected and the meter application is filed.' },
  },
  {
    name: /*i18n*/ { id: 'Utility inspection' },
    description: /*i18n*/ { id: 'The electricity utility inspects and approves the installation.' },
  },
  {
    name: /*i18n*/ { id: 'Commissioning' },
    description: /*i18n*/ { id: 'The system is switched on and starts generating.' },
  },
  {
    name: /*i18n*/ { id: 'Incentive claim' },
    description: /*i18n*/ { id: 'The incentive claim is filed on your behalf.' },
  },
  {
    name: /*i18n*/ { id: 'Handover' },
    description: /*i18n*/ {
      id: 'Documents, warranties and the monitoring login are handed over to you.',
    },
  },
];

/** A standard split's name; `{split}` is its shares, as `10/60/20/10`. */
const SPLIT_NAME = /*i18n*/ { id: 'Standard {split}' };

const TRANCHE: Readonly<Record<StandardTranche, MessageRef>> = {
  on_signing: /*i18n*/ { id: 'Advance on signing' },
  before_dispatch: /*i18n*/ { id: 'Before dispatch' },
  on_installation: /*i18n*/ { id: 'On installation' },
  on_commissioning: /*i18n*/ { id: 'On commissioning' },
};

/** Every document default in one reader's words. */
export function documentDefaults(t: Translator['t']): DocumentDefaults {
  return {
    terms: richTextParagraphs(TERMS.map((paragraph) => t(paragraph))),
    phases: PHASES.map((phase) => ({ name: t(phase.name), description: t(phase.description) })),
    trancheTemplates: standardTrancheTemplates({
      name: (split) => t(SPLIT_NAME, { split }),
      tranche: {
        on_signing: t(TRANCHE.on_signing),
        before_dispatch: t(TRANCHE.before_dispatch),
        on_installation: t(TRANCHE.on_installation),
        on_commissioning: t(TRANCHE.on_commissioning),
      },
    }),
  };
}
