import type { RolePreset } from '../authz/roles';
import { opensSettingsRow, type SettingsRow } from './settings-rows';

/**
 * What a company sets up before its first proposal goes out, in the order a proposal needs it:
 * who it is from, how it looks, what it sells at a published price, how it is paid, the document
 * itself, and the people who will send it. Each is a settings row, so a person sees only the steps
 * their presets open (`F7-48`).
 */
export const SETUP_STEPS = [
  'company_profile',
  'branding',
  'catalog',
  'payment_terms',
  'proposal_templates',
  'team',
] as const satisfies readonly SettingsRow[];
export type SetupStep = (typeof SETUP_STEPS)[number];

/**
 * The facts each step is judged by, every one read from the record its own page reads. A fact
 * still out (or not this person's to read) is `null`, and its step is not judged yet.
 */
export interface SetupFacts {
  /** The business profile: an address, the bank details and one tax registration on record. */
  readonly profile: {
    readonly address: boolean;
    readonly bank: boolean;
    readonly registrations: number;
    readonly logo: boolean;
  } | null;
  /** Catalog releases published; a proposal prices only from a release. */
  readonly releases: number | null;
  /** Payment-term templates the company can choose. */
  readonly paymentTemplates: number | null;
  /** Whether the company has saved its own proposal template (the platform's stands in until then). */
  readonly templateOwn: boolean | null;
  /** People on the team and invitations still out. */
  readonly people: number | null;
  readonly invites: number | null;
}

/** One step: done, not yet, or not judged while its fact is out. */
export interface SetupStepState {
  readonly step: SetupStep;
  readonly done: boolean | null;
}

export interface SetupReadiness {
  /** The steps this person opens, in order. */
  readonly steps: readonly SetupStepState[];
  readonly done: number;
  readonly total: number;
  /** The first step not done yet; null once every judged step is done. */
  readonly next: SetupStep | null;
  /** Every step judged and done. */
  readonly complete: boolean;
}

const JUDGE: Record<SetupStep, (facts: SetupFacts) => boolean | null> = {
  company_profile: ({ profile }) =>
    profile === null ? null : profile.address && profile.bank && profile.registrations > 0,
  branding: ({ profile }) => (profile === null ? null : profile.logo),
  catalog: ({ releases }) => (releases === null ? null : releases > 0),
  payment_terms: ({ paymentTemplates }) =>
    paymentTemplates === null ? null : paymentTemplates > 0,
  proposal_templates: ({ templateOwn }) => templateOwn,
  team: ({ people, invites }) =>
    people === null || invites === null ? null : people > 1 || invites > 0,
};

/** Where this person's company stands before its first proposal, from what the pages read. */
export function setupReadiness(roles: readonly RolePreset[], facts: SetupFacts): SetupReadiness {
  const steps = SETUP_STEPS.filter((step) => opensSettingsRow(roles, step)).map((step) => ({
    step,
    done: JUDGE[step](facts),
  }));
  const done = steps.filter((s) => s.done === true).length;
  const next = steps.find((s) => s.done === false)?.step ?? null;
  return {
    steps,
    done,
    total: steps.length,
    next,
    complete: steps.length > 0 && done === steps.length,
  };
}
