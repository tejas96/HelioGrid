import { randomUUID } from 'node:crypto';
import {
  type ActivityKind,
  type ActivityPage,
  type CreateLead,
  type DedupeMatchWire,
  IDEMPOTENCY_KEY_HEADER,
  type LeadDetail,
  rolePresetSchema,
} from '@heliogrid/contracts';
import { activity, auditLogEntry, customer, lead, notification } from '@heliogrid/db';
import { MS_PER_DAY, type RolePreset } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { documentDefaultsIn } from '../../src/modules/settings/internal/document-defaults';
import { seedTenantSettings } from '../../src/modules/settings/settings.admin.repository';
import {
  aCompany,
  aDevice,
  aMembership,
  aPerson,
  type Company,
  type Device,
  type Fixture,
  type Membership,
  openPools,
  type Person,
  seed,
  unseed,
} from '../support/fixture';
import { bearerFor, bootHttp, type Http, type Reply } from '../support/http';
import { publishIndiaPack } from '../support/market';

export { aPhone } from '../support/fixture';

/** The presets by name, so a team is written without typing a role string. */
export const preset = rolePresetSchema.enum;

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
export const HOUR_MS = MS_PER_DAY / HOURS_PER_DAY;
export const MINUTE_MS = HOUR_MS / MINUTES_PER_HOUR;

/**
 * One CRM proof's world: companies, the people in them under the presets the case needs, and the
 * api over real HTTP — each person calls it with their own device's bearer, so the guard, the
 * scope and the envelope are the ones a person meets. Every company is seeded as tenant creation
 * seeds it (`seedTenantSettings`: the three contact role labels among the rest).
 */
export interface CrmWorld {
  readonly pools: ReturnType<typeof openPools>;
  readonly http: Http;
  /** The api as this member, with any extra headers — a retry key. */
  as(member: Membership): Caller;
  close(): Promise<void>;
}

export interface Caller {
  call<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<Reply<T>>;
}

/** A team in one company: name → presets. */
export type Team = Readonly<Record<string, readonly RolePreset[]>>;

export interface Staffed<T extends Team> {
  readonly company: Company;
  readonly people: { readonly [Name in keyof T]: Person };
  readonly members: { readonly [Name in keyof T]: Membership };
}

/** A company staffed with the named people, each holding the presets given. */
export function aStaffedCompany<T extends Team>(name: string, team: T): Staffed<T> {
  const company = aCompany(name);
  const people = Object.fromEntries(Object.keys(team).map((who) => [who, aPerson(who)])) as {
    [Name in keyof T]: Person;
  };
  const members = Object.fromEntries(
    Object.entries(team).map(([who, roles]) => [
      who,
      aMembership(company, people[who] as Person, roles),
    ]),
  ) as { [Name in keyof T]: Membership };
  return { company, people, members };
}

export async function openCrmWorld(staffed: readonly Staffed<Team>[]): Promise<CrmWorld> {
  const memberships = staffed.flatMap((one) => Object.values(one.members));
  const devices = new Map(memberships.map((m) => [m, aDevice(m.held, m.of)]));
  const fixture: Fixture = {
    companies: staffed.map((one) => one.company),
    people: staffed.flatMap((one) => Object.values(one.people)),
    memberships,
    devices: [...devices.values()],
  };
  const pools = openPools();
  await seed(pools.admin.db, fixture);
  await publishIndiaPack(pools);
  const standardSplits = (await documentDefaultsIn('en')).trancheTemplates;
  for (const one of staffed) {
    await pools.admin.db.transaction((tx) =>
      seedTenantSettings(tx, { tenantId: one.company.tenantId, now: Date.now(), standardSplits }),
    );
  }
  const http = await bootHttp();
  return {
    pools,
    http,
    as: (member) => ({
      call: async (method, path, body, headers = {}) =>
        http.call(method, path, body, {
          ...(await bearerFor(http, member, devices.get(member) as Device)),
          ...headers,
        }),
    }),
    async close() {
      await http.close();
      await unseed(pools.admin.db, fixture);
      await pools.close();
    },
  };
}

/** A retry key header, fresh unless one is given. */
export const retryKey = (key: string = randomUUID()) => ({ [IDEMPOTENCY_KEY_HEADER]: key });

/** A quick add's body: the number, the device's moment, and whatever else the case types. */
export const aCapture = (phoneE164: string, typed: Partial<CreateLead> = {}): CreateLead => ({
  phoneE164,
  capturedAt: new Date().toISOString(),
  ...typed,
});

/** The dedupe sheet's refusal: its code, and the record the number belongs to. */
export interface SheetRefusal {
  readonly error: { readonly code: string; readonly facts: DedupeMatchWire };
}

/** A quick add as sent, whatever it answers — a lead, or the sheet. */
export function capture(caller: Caller, body: CreateLead) {
  return caller.call<LeadDetail | SheetRefusal>('POST', '/leads', body, retryKey());
}

/** The same number with the trunk zero some write after the code: `+91 0 98450 27746`. */
export const withTrunkZero = (phoneE164: string) => phoneE164.replace(/^\+91/, '+910');

/** A capture that must save: its 201 body, or a thrown reply naming what came back. */
export async function captured(caller: Caller, body: CreateLead): Promise<LeadDetail> {
  const reply = await caller.call<LeadDetail>('POST', '/leads', body, retryKey());
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`capture: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

/** A lead's timeline, newest first, as the reader sees it. */
export async function timelineOf(caller: Caller, leadId: string): Promise<ActivityPage> {
  const reply = await caller.call<ActivityPage>('GET', `/leads/${leadId}/activities?limit=100`);
  if (reply.status !== HttpStatus.OK) throw new Error(`timeline: got ${reply.status}`);
  return reply.body;
}

/** Hands a lead to an owner as the assign slice will — on the admin path, outside the api. */
export async function ownLead(world: CrmWorld, leadId: string, ownerUserId: string): Promise<void> {
  await world.pools.admin.db.update(lead).set({ ownerUserId }).where(eq(lead.id, leadId));
}

/** The timeline rows of one lead, oldest first, on the admin path. */
export function storedEntriesOf(world: CrmWorld, leadId: string) {
  return world.pools.admin.db
    .select()
    .from(activity)
    .where(eq(activity.leadId, leadId))
    .orderBy(asc(activity.sequence));
}

/** The notices one person holds about one subject, on the admin path. */
export function noticesOf(world: CrmWorld, recipientUserRef: string, subjectRef: string) {
  return world.pools.admin.db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.recipientUserRef, recipientUserRef),
        eq(notification.subjectRef, subjectRef),
      ),
    );
}

/** The timeline rows of one kind on one lead, oldest first, on the admin path. */
export async function entriesOfKind(world: CrmWorld, leadId: string, kind: ActivityKind) {
  return (await storedEntriesOf(world, leadId)).filter((one) => one.kind === kind);
}

/** The customers holding a number in one company, on the admin path. */
export function customersHolding(world: CrmWorld, tenantId: string, phoneE164: string) {
  return world.pools.admin.db
    .select({ id: customer.id, name: customer.name })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), eq(customer.phoneE164, phoneE164)));
}

/** A customer's leads with their stage and owner, on the admin path. */
export function leadsOf(world: CrmWorld, customerId: string) {
  return world.pools.admin.db
    .select({ id: lead.id, stage: lead.stage, owner: lead.ownerUserId })
    .from(lead)
    .where(eq(lead.customerId, customerId));
}

/** One company's audit entries of one event, on the admin path. */
export function auditEntriesOf(world: CrmWorld, tenantId: string, eventType: string) {
  return world.pools.admin.db
    .select()
    .from(auditLogEntry)
    .where(
      and(
        eq(auditLogEntry.tenantId, tenantId),
        sql`${auditLogEntry.eventType}::text = ${eventType}`,
      ),
    );
}
