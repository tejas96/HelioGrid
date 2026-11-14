import { z } from 'zod';
import {
  amountSchema,
  currencyCodeSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  percentSchema,
  uuidSchema,
} from '../common';
import { projectChainStageSchema } from '../document-templates';
import { proposalTrancheSchema } from '../proposals/money';
import { calendarDateSchema, clockTimeSchema } from '../tenant-settings';

/*
 * Where a proposal meets its project (`M07-62`, `M08-50`, `M11-14`, `F5-68`): what Mark won takes
 * from the accepted version, the version a project runs on after a change of scope, and the
 * installation day's facts the customer is told. The server finds the accepted version from the
 * lead itself — a device never names one (`F4-04`).
 */

/** What Mark won opens on (`wonBasisOf`): only an acceptance of the latest shared version fills it. */
const WON_BASES = ['accepted_version', 'newer_version_unanswered', 'no_acceptance'] as const;

/** The acceptance as the sheet's proof line states it (`F5-46`): who, when and through which link. */
export const acceptanceProofSchema = z.object({
  version: z.number().int().positive(),
  acceptedAt: z.string().datetime(),
  linkLabel: z.string(),
  contactName: z.string().nullable(),
});

const wonBasisObject = z.object({
  basis: extensibleEnum(WON_BASES),
  currencyCode: currencyCodeSchema,
  proposal: z.object({ id: uuidSchema, number: z.string() }).nullable(),
  /** The acceptance that stands — also on `newer_version_unanswered`, where it is an earlier version's. */
  acceptance: acceptanceProofSchema.nullable(),
  /** The newer shared version nobody answered, which is why the value is typed. */
  unansweredVersion: z.number().int().positive().nullable(),
  /** The accepted version's payable: shown locked, never typed. `null` where the value is typed. */
  finalValue: nonNegativeAmountSchema.nullable(),
  /** The plan the project starts with: the accepted version's rows, else the company's default terms. */
  plan: z.array(
    proposalTrancheSchema.omit({ amount: true }).extend({ amount: amountSchema.nullable() }),
  ),
  /** Another lead of the same customer holds a live proposal — never won twice unseen (`M06-58`). */
  siblingProposal: z
    .object({ leadId: uuidSchema, proposalId: uuidSchema, number: z.string().nullable() })
    .nullable(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface WonBasisSchema extends WonBasisSchemaObject {}
type WonBasisSchemaObject = typeof wonBasisObject;
export const wonBasisSchema: WonBasisSchema = wonBasisObject;
export type WonBasisWire = z.infer<typeof wonBasisSchema>;

/** A part of the plan after a version is put in force: what is paid stays, the rest is split anew. */
const IN_FORCE_PART_STATES = ['paid', 'part_paid', 'new'] as const;

/** *Put version N in force* (`M08-50`, `M11-14`), as its sheet shows it before the person confirms. */
const versionInForcePreviewObject = z.object({
  version: z.number().int().positive(),
  currencyCode: currencyCodeSchema,
  newTotal: nonNegativeAmountSchema,
  /** Already collected: every receipt stays as it is. */
  paid: nonNegativeAmountSchema,
  remaining: nonNegativeAmountSchema,
  /** More collected than the new total — stated, never hidden. */
  surplus: nonNegativeAmountSchema.nullable(),
  plan: z.array(
    z.object({
      label: z.string(),
      amount: nonNegativeAmountSchema,
      state: extensibleEnum(IN_FORCE_PART_STATES),
      /** The stage that makes the part due — the line under a new part's name. */
      dueOnStage: projectChainStageSchema.nullable(),
      /** A new part's share of what is left; `null` for the last, which takes the rest, and a kept part. */
      shareOfRest: percentSchema.nullable(),
      /** The day a kept part's last payment came in; `null` for a new part. */
      paidOn: calendarDateSchema.nullable(),
    }),
  ),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface VersionInForcePreviewSchema extends VersionInForcePreviewSchemaObject {}
type VersionInForcePreviewSchemaObject = typeof versionInForcePreviewObject;
export const versionInForcePreviewSchema: VersionInForcePreviewSchema = versionInForcePreviewObject;
export type VersionInForcePreview = z.infer<typeof versionInForcePreviewSchema>;

/** The installation day as the customer is told it (`F5-68`): each fact `null` until scheduled. */
export const installationFactsSchema = z.object({
  on: calendarDateSchema.nullable(),
  startTime: clockTimeSchema.nullable(),
  /** Working days the crew is on site; halves allowed. */
  durationDays: z.number().positive().nullable(),
  /** What the customer should expect, in the project manager's words. */
  disturbance: z.string().nullable(),
  crewLead: z.object({ userId: uuidSchema, name: z.string(), phoneE164: z.string() }).nullable(),
});
export type InstallationFacts = z.infer<typeof installationFactsSchema>;
