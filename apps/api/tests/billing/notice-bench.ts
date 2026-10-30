import { randomUUID } from 'node:crypto';
import type { MessageDelivery, MessageDeliveryRequest } from '@heliogrid/contracts';
import { dunningEvent, notification, subscription, tenant, userAccount } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY } from '@heliogrid/domain';
import { asc, eq, sql } from 'drizzle-orm';
import { BillingNoticeAdminRepository } from '../../src/modules/billing/billing-notice.admin.repository';
import { BillingNoticeService } from '../../src/modules/billing/billing-notice.service';
import { BillingNoticeCandidatesAdminRepository } from '../../src/modules/billing/billing-notice-candidates.admin.repository';
import { DevelopmentPushDelivery } from '../../src/modules/notification/internal/push-delivery.development';
import { PushDeviceAdminRepository } from '../../src/modules/notification/notification.devices.admin.repository';
import { NotificationPreferencesRepository } from '../../src/modules/notification/notification.preferences.repository';
import { NotificationPushAdminRepository } from '../../src/modules/notification/notification.push.admin.repository';
import { NotificationPushService } from '../../src/modules/notification/notification.push.service';
import { settingsServicesOf } from '../settings/support';
import {
  aCompany,
  aMembership,
  aPerson,
  type Company,
  type Membership,
  type openPools,
  type Person,
  seed,
  unseed,
} from '../support/fixture';
import { type HeldLock, holdLock } from '../support/held-lock';
import { marketsOf } from '../support/market';
import { aPlan, silentLogger } from './support';

type Pools = ReturnType<typeof openPools>;

/**
 * The notice sweep's suites share this bench. The sweep reads every company, and other suites run
 * beside these. So every moment sits in 2001: after the timers' 1990 and the charges' 1995, so no
 * sweep of theirs moves these rows, and before any company another suite signs up today, so this
 * sweep tells none of theirs.
 */

/** 11:30 in Kolkata, outside every quiet window the market defaults to. */
export const FAILED = Date.parse('2001-03-03T06:00:00Z');
/** Inside the India book's 24-month horizon at `FAILED`. */
export const SIGNED_UP_PROTECTED = Date.parse('2000-06-01T00:00:00Z');
/** Past it. */
export const SIGNED_UP_LONG_AGO = Date.parse('1996-01-01T00:00:00Z');
/** A sweep a minute after a moment; a minute is the sweep's own cadence. */
export const aMinute = 60_000;
export const day = (n: number) => FAILED + n * MS_PER_DAY;

/**
 * The sweep tells every company it finds, so two suites that seed and sweep the same years would
 * tell each other's companies. Each case holds this lock from its first seed to its cleanup.
 */
export function holdTheSweep(): Promise<HeldLock> {
  return holdLock(sql`select pg_advisory_xact_lock(hashtext('billing-notice-suites'))`);
}

/** The carrier the platform texts through, recorded: a third party no suite may reach. */
export class RecordedCarrier implements MessageDelivery {
  readonly sent: MessageDeliveryRequest[] = [];
  async send(request: MessageDeliveryRequest): Promise<void> {
    this.sent.push(request);
  }
}

/** The sweep as `billing-notice.module.ts` composes it, over the real repositories on both pools. */
export function noticeServiceOf(pools: Pools, carrier: MessageDelivery): BillingNoticeService {
  return new BillingNoticeService(
    new BillingNoticeCandidatesAdminRepository(pools.admin.db),
    new BillingNoticeAdminRepository(pools.admin.db),
    settingsServicesOf(pools).settings,
    marketsOf(pools),
    new NotificationPushService(
      new NotificationPushAdminRepository(pools.admin.db),
      new PushDeviceAdminRepository(pools.admin.db),
      new NotificationPreferencesRepository(pools.tenants),
      new DevelopmentPushDelivery(silentLogger()),
      silentLogger(),
    ),
    carrier,
    silentLogger(),
  );
}

/** The companies a suite seeded, with their owners, removed after each case. */
export class NoticeCompanies {
  private companies: Company[] = [];
  private people: Person[] = [];
  private memberships: Membership[] = [];

  constructor(private readonly pools: Pools) {}

  async removeAll(): Promise<void> {
    const { companies, people, memberships } = this;
    await unseed(this.pools.admin.db, { companies, people, memberships });
    this.companies = [];
    this.people = [];
    this.memberships = [];
  }

  /** A company signed up at `signedUpAt`, with one EPC Owner per language, holding one subscription. */
  async holding(
    held: { state: 'active' | 'past_due' | 'trialing'; enteredAt: number; trialEndsAt?: number },
    signedUpAt = SIGNED_UP_PROTECTED,
    owners: readonly ('en' | 'hi')[] = ['en'],
  ) {
    const db = this.pools.admin.db;
    const company = aCompany(`Dunning ${randomUUID()}`);
    const heldBy = owners.map((language) => ({ person: aPerson(`Owner ${language}`), language }));
    const roles = heldBy.map(({ person }) => aMembership(company, person, [FOUNDER_ROLE]));
    const people = heldBy.map(({ person }) => person);
    this.companies.push(company);
    this.people.push(...people);
    this.memberships.push(...roles);
    await seed(db, { companies: [company], people, memberships: roles });
    for (const { person, language } of heldBy) {
      await db
        .update(userAccount)
        .set({ interfaceLanguage: language })
        .where(eq(userAccount.id, person.userId));
    }
    await db
      .update(tenant)
      .set({ createdAt: new Date(signedUpAt) })
      .where(eq(tenant.id, company.tenantId));
    const [row] = await db
      .insert(subscription)
      .values({
        tenantId: company.tenantId,
        state: held.state,
        stateEnteredAt: new Date(held.enteredAt),
        trialEndsAt: held.trialEndsAt === undefined ? null : new Date(held.trialEndsAt),
        paidPeriodEnd: held.state === 'trialing' ? null : new Date(held.enteredAt),
        createdAt: new Date(held.enteredAt),
        // A paying row was converted onto a plan, and a charge on it issues an invoice for it.
        ...(held.state === 'trialing' ? {} : await aPlan(db)),
      })
      .returning({ id: subscription.id });
    if (row === undefined) throw new Error('the subscription was not seeded');
    return { tenantId: company.tenantId, subscriptionId: row.id, owners: people };
  }
}

/** The notices told to one subscription, in ladder order. */
export function toldTo(pools: Pools, subscriptionId: string) {
  return pools.admin.db
    .select()
    .from(dunningEvent)
    .where(eq(dunningEvent.subscriptionId, subscriptionId))
    .orderBy(asc(dunningEvent.dueAt));
}

/** The notifications a company's owners received, oldest first. */
export function notificationsOf(pools: Pools, tenantId: string) {
  return pools.admin.db
    .select({
      type: notification.type,
      title: notification.title,
      body: notification.body,
      language: notification.language,
      subjectKind: notification.subjectKind,
      subjectRef: notification.subjectRef,
      recipient: notification.recipientUserRef,
      pushSentAt: notification.pushSentAt,
    })
    .from(notification)
    .where(eq(notification.tenantId, tenantId))
    .orderBy(asc(notification.emittedAt), asc(notification.id));
}

/** What the billing timers record, done by hand so no timer run reaches another suite's rows. */
export async function moveTo(
  pools: Pools,
  subscriptionId: string,
  state: 'halted' | 'expired',
  enteredAt: number,
): Promise<void> {
  await pools.admin.db
    .update(subscription)
    .set({ state, stateEnteredAt: new Date(enteredAt) })
    .where(eq(subscription.id, subscriptionId));
}
