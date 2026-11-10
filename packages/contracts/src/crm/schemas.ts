import {
  COMPANY_PROFILE_FIELD_CAP,
  LEAD_SOURCES,
  TASK_KINDS,
  TASK_PROVENANCES,
} from '@heliogrid/domain';
import { z } from 'zod';
import {
  amountSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  phoneE164Schema,
  provenanceTierSchema,
  uuidSchema,
} from '../common';
import { uiLanguageResponseSchema } from '../locale';
import { calendarDateSchema, clockTimeSchema } from '../tenant-settings';
import {
  contactRoleSeedSchema,
  dealSegmentSchema,
  leadLifecycleStateSchema,
  leadStageSchema,
  taskStatusSchema,
} from './vocabulary';

/*
 * The CRM's shared shapes (`M02`): the parts every lead read, act and search row is made of. The
 * routes live beside them, one router per area.
 */

/**
 * When the person did it, by their device's clock — shown and audited, never what orders the
 * timeline: the server's apply order does (`F4-19`, `M02-36`).
 */
export const capturedAtSchema = z.string().datetime();

/** A sentence a person types onto the record: a note, a reason, a custom task's title. */
export const crmTextSchema = z.string().trim().min(1).max(2000);

/** Why a duplicate was kept or a lead reassigned — mandatory where asked, audited (`M02-12`). */
export const crmReasonSchema = z.string().trim().min(1).max(500);

/** The address a surveyor is sent to, as the customer confirmed it on the call (`M02-46`). */
export const visitAddressSchema = z.string().trim().min(1).max(COMPANY_PROFILE_FIELD_CAP.address);

/** A member as a CRM record names them — the owner, the assignee, the surveyor, an actor. */
export const memberRefSchema = z.object({ userId: uuidSchema, name: z.string() });
export type MemberRef = z.infer<typeof memberRefSchema>;

/** The monthly bill as written: never below zero, in the tenant's currency (`M02-40`). */
export const monthlyBillWriteSchema = nonNegativeAmountSchema;

/**
 * The monthly bill as read, with its provenance tier — a bill typed from a call is `assumed`
 * (`F8-01`); the document carries the currency.
 */
export const monthlyBillSchema = z.object({ amount: amountSchema, tier: provenanceTierSchema });
export type MonthlyBill = z.infer<typeof monthlyBillSchema>;

/**
 * A lead's estimated value (`M02-38`): a forecast input, never revenue, provisional until a
 * proposal is computed. Always `null` until the proposal module supplies it — "No value yet".
 */
export const estimatedValueSchema = z.object({
  amount: amountSchema,
  tier: provenanceTierSchema,
  provisional: z.boolean(),
});

/**
 * One contact role label (`M02-34`): a seeded label carries its key and is worded by the catalog;
 * a company's own carries its text as typed (`F3-10`). Exactly one of the two is set.
 */
export const contactRoleLabelSchema = z.object({
  id: uuidSchema,
  seed: contactRoleSeedSchema.nullable(),
  text: z.string().nullable(),
});
export type ContactRoleLabel = z.infer<typeof contactRoleLabelSchema>;

/** A person beside the customer (`M02-34`); their number joins dedupe (`M02-02`). */
export const contactSchema = z.object({
  id: uuidSchema,
  customerId: uuidSchema,
  name: z.string(),
  phoneE164: phoneE164Schema,
  role: contactRoleLabelSchema.nullable(),
});
export type Contact = z.infer<typeof contactSchema>;

/**
 * The customer behind a lead (`M02-02`, `M02-37`). `name` and `city` are named gaps while null
 * (`M02-03`). `primaryContactId` null means the customer is their own primary contact, so exactly
 * one primary holds by shape. `wrongNumber` set removes every dial offer for the number (`M02-44`).
 */
export const customerSchema = z.object({
  id: uuidSchema,
  name: z.string().nullable(),
  phoneE164: phoneE164Schema,
  city: z.string().nullable(),
  preferredLanguage: uiLanguageResponseSchema.nullable(),
  doNotCall: z.boolean(),
  wrongNumber: z.boolean(),
  primaryContactId: uuidSchema.nullable(),
  contacts: z.array(contactSchema),
  /** Customers kept beside this one on purpose (`M02-12`): each shows the other until merged. */
  keptDuplicates: z.array(
    z.object({ customerId: uuidSchema, name: z.string().nullable(), reason: z.string() }),
  ),
  /** The leads this customer referred (`M02-16`) — attribution only, never a credit. */
  referred: z.array(z.object({ leadId: uuidSchema, name: z.string().nullable() })),
});
export type Customer = z.infer<typeof customerSchema>;

/**
 * One lead as the list and the inbox show it. `state` null is an active lead; no
 * owner is the unassigned queue (`M02-50`). The document carries the currency.
 */
export const leadSummarySchema = z.object({
  id: uuidSchema,
  customerId: uuidSchema,
  name: z.string().nullable(),
  phoneE164: phoneE164Schema,
  city: z.string().nullable(),
  segment: dealSegmentSchema.nullable(),
  source: extensibleEnum(LEAD_SOURCES),
  stage: leadStageSchema,
  state: leadLifecycleStateSchema.nullable(),
  owner: memberRefSchema.nullable(),
  monthlyBill: monthlyBillSchema.nullable(),
  value: estimatedValueSchema.nullable(),
  createdAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
});
export type LeadSummary = z.infer<typeof leadSummarySchema>;

/**
 * One follow-up task (`M07-05`, decision 8 of the block 3 RFC). Overdue is derived on the screen
 * from `dueAt` (`tasks/overdue.ts`), never stored; `title` is a custom task's words.
 */
export const taskSchema = z.object({
  id: uuidSchema,
  leadId: uuidSchema,
  kind: extensibleEnum(TASK_KINDS),
  title: z.string().nullable(),
  status: taskStatusSchema,
  dueAt: z.string().datetime(),
  assignee: memberRefSchema,
  provenance: extensibleEnum(TASK_PROVENANCES),
  doneAt: z.string().datetime().nullable(),
});
export type Task = z.infer<typeof taskSchema>;

/**
 * A booked site visit (`M02-46`): the lead's record of the booking M04 takes over. A no-show's
 * reschedule books a successor and names the visit it replaces (`M02-48`).
 */
export const visitSchema = z.object({
  id: uuidSchema,
  date: calendarDateSchema,
  time: clockTimeSchema,
  surveyor: memberRefSchema,
  address: z.string(),
  rescheduledFromId: uuidSchema.nullable(),
  bookedAt: z.string().datetime(),
});
export type Visit = z.infer<typeof visitSchema>;

/**
 * What a number already belongs to (`M02-08`), as the dedupe sheet shows it (`crm/dedupe-facts.ts`).
 * A record the person may open carries its name and city beside the three facts — owner, stage,
 * last contact; one outside their scope carries the three facts only, never its contents, and the
 * lead id an ask to its owner is sent against.
 */
const sheetFacts = {
  leadId: uuidSchema,
  ownerName: z.string().nullable(),
  stage: leadStageSchema,
  lastContactAt: z.string().datetime().nullable(),
};
export const dedupeMatchSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('visible'),
    ...sheetFacts,
    customerId: uuidSchema,
    name: z.string().nullable(),
    city: z.string().nullable(),
  }),
  z.object({ kind: z.literal('out_of_scope'), ...sheetFacts }),
]);
export type DedupeMatchWire = z.infer<typeof dedupeMatchSchema>;
