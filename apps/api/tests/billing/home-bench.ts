import { randomUUID } from 'node:crypto';
import {
  billingCheckout,
  creditNote,
  dunningEvent,
  invoiceLine,
  subscription,
  subscriptionInvoice,
  subscriptionPayment,
  subscriptionStateHistory,
} from '@heliogrid/db';
import {
  type BillingCycle,
  type BillingNotice,
  type BillingState,
  FOUNDER_ROLE,
  IN_PACK,
  type InvoiceStatus,
  listedPrice,
  type MinorUnits,
  MS_PER_DAY,
  type SubscriptionCause,
  type Tier,
} from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import { eq } from 'drizzle-orm';
import { aDevice } from '../support/devices';
import {
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  unseed,
} from '../support/fixture';
import { bearerFor, type Http, type Reply } from '../support/http';
import { ConversionHarness, NOT_BILLING } from './conversion-harness';
import { aPlan, aTrial, collectedFor } from './support';

type Plan = Awaited<ReturnType<typeof aPlan>>;

/** Enough of a uuid to keep a document number unique in market `ZZ`. */
const NUMBER_SUFFIX = 8;
/** The month an invoice of the bench pays for. */
const PERIOD_DAYS = 30;

const now = Date.now();
export const daysFromNow = (days: number) => now + days * MS_PER_DAY;
export const iso = (moment: number) => new Date(moment).toISOString();
export const decimal = (amount: MinorUnits) =>
  minorUnitsToDecimal(amount, IN_PACK.formats.minorUnitDigits);

/** Today's IN list price for a tier on a cycle, sold while the platform is not registered (`F1-29`). */
export function todaysSale(tier: Tier, cycle: BillingCycle) {
  const list = listedPrice(IN_PACK.priceBook, tier, cycle);
  if (list === null) throw new Error(`the IN book sells no ${tier} ${cycle}`);
  return { list: decimal(list), taxRateBasisPoints: null, tax: null, total: decimal(list) };
}

/** A company of its own with its Owner and one member who holds no billing capability. */
export interface HomeCompany {
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly owner: () => Promise<Record<string, string>>;
  readonly member: () => Promise<Record<string, string>>;
}

/**
 * The billing home's suites (`SCR-M12-02`): the api as it boots with today's IN prices synced, and
 * companies whose rows a case puts in any state by hand, as the timers and charges would leave them.
 * Every company is its own and removed at `close`; numbers sit in market `ZZ`, which no series uses.
 */
export class HomeBench {
  private readonly seeded: Fixture[] = [];

  private constructor(
    readonly pools: ReturnType<typeof openPools>,
    readonly http: Http,
  ) {}

  static async open(): Promise<HomeBench> {
    const harness = await ConversionHarness.open();
    return new HomeBench(harness.pools, harness.http);
  }

  async close(): Promise<void> {
    await this.http.close();
    for (const mine of this.seeded) await unseed(this.pools.admin.db, mine);
    await this.pools.close();
  }

  get = <T>(path: string, headers: Record<string, string>): Promise<Reply<T>> =>
    this.http.call<T>('GET', path, undefined, headers);

  /** A company on a trial that ends `trialDaysLeft` from now. */
  async aCompany(name: string, trialDaysLeft = 7): Promise<HomeCompany> {
    const company = aCompany(`${name} ${randomUUID()}`);
    const ownerPerson = aPerson(`${name} Owner`);
    const memberPerson = aPerson(`${name} Sales`);
    const owner = aMembership(company, ownerPerson, [FOUNDER_ROLE]);
    const member = aMembership(company, memberPerson, [NOT_BILLING]);
    const devices = [aDevice(ownerPerson, company), aDevice(memberPerson, company)] as const;
    const mine: Fixture = {
      companies: [company],
      people: [ownerPerson, memberPerson],
      memberships: [owner, member],
      devices: [...devices],
    };
    await seed(this.pools.admin.db, mine);
    this.seeded.push(mine);
    const subscriptionId = await aTrial(
      this.pools.admin.db,
      company.tenantId,
      Date.now() + trialDaysLeft * MS_PER_DAY,
    );
    return {
      tenantId: company.tenantId,
      subscriptionId,
      owner: () => bearerFor(this.http, owner, devices[0]),
      member: () => bearerFor(this.http, member, devices[1]),
    };
  }

  /** The row moved to `state`, converted onto `plan` when one is given. */
  async put(
    held: HomeCompany,
    state: BillingState,
    at: { readonly enteredAt: number; readonly paidPeriodEnd?: number | null },
    plan?: Plan,
  ): Promise<void> {
    await this.pools.admin.db
      .update(subscription)
      .set({
        state,
        stateEnteredAt: new Date(at.enteredAt),
        paidPeriodEnd: at.paidPeriodEnd == null ? null : new Date(at.paidPeriodEnd),
        ...(plan === undefined
          ? {}
          : {
              tier: plan.tier,
              cycle: plan.cycle,
              planPriceId: plan.planPriceId,
              gatewayRef: plan.gatewayRef,
            }),
      })
      .where(eq(subscription.id, held.subscriptionId));
  }

  /** The hosted page that opened the row's mandate: the page `Update` and `Pay` open. */
  async aMandatePage(held: HomeCompany, plan: Plan): Promise<string> {
    const hostedUrl = `https://pay.example.test/${plan.gatewayRef}`;
    await this.pools.admin.db.insert(billingCheckout).values({
      tenantId: held.tenantId,
      subscriptionId: held.subscriptionId,
      planPriceId: plan.planPriceId,
      collection: 'mandate',
      gatewayRef: plan.gatewayRef,
      hostedUrl,
      expiresAt: new Date(Date.now() - MS_PER_DAY),
      openedAt: new Date(Date.now() - 2 * MS_PER_DAY),
      closedAt: new Date(Date.now() - MS_PER_DAY),
    });
    return hostedUrl;
  }

  /** A charge the gateway collected on the row, `paidAt`, paying through `paysThrough`. */
  async aPayment(held: HomeCompany, plan: Plan, paidAt: number, paysThrough: number) {
    const [paid] = await this.pools.admin.db
      .insert(subscriptionPayment)
      .values({
        tenantId: held.tenantId,
        subscriptionId: held.subscriptionId,
        gatewayChargeRef: `pay_${randomUUID()}`,
        amountMinor: collectedFor(plan.tier, plan.cycle),
        currencyCode: 'INR',
        paysThrough: new Date(paysThrough),
        occurredAt: new Date(paidAt),
        recordedAt: new Date(paidAt),
      })
      .returning({ id: subscriptionPayment.id });
    if (paid === undefined) throw new Error('the payment was not written');
    return paid.id;
  }

  /** An invoice of the row with one plan line of `list`, as the issue leaves it. */
  async anInvoice(
    held: HomeCompany,
    plan: Plan,
    invoice: {
      readonly status: InvoiceStatus;
      readonly issuedAt: number;
      readonly number?: string;
      readonly paymentId?: string;
      readonly link?: { readonly hostedUrl: string; readonly dueAt: number };
      readonly list?: MinorUnits;
    },
  ): Promise<{ id: string; number: string }> {
    const number = invoice.number ?? `HG/ZZ/${randomUUID().slice(0, NUMBER_SUFFIX)}`;
    const [issued] = await this.pools.admin.db
      .insert(subscriptionInvoice)
      .values({
        tenantId: held.tenantId,
        subscriptionId: held.subscriptionId,
        paymentId: invoice.paymentId ?? null,
        marketCode: 'ZZ',
        number,
        kind: 'cycle',
        status: invoice.status,
        currencyCode: 'INR',
        paysThrough: new Date(invoice.issuedAt + PERIOD_DAYS * MS_PER_DAY),
        issuedAt: new Date(invoice.issuedAt),
        ...(invoice.link === undefined
          ? {}
          : {
              gatewayRef: `plink_${randomUUID()}`,
              hostedUrl: invoice.link.hostedUrl,
              dueAt: new Date(invoice.link.dueAt),
            }),
      })
      .returning({ id: subscriptionInvoice.id });
    if (issued === undefined) throw new Error('the invoice was not written');
    await this.pools.admin.db.insert(invoiceLine).values({
      tenantId: held.tenantId,
      invoiceId: issued.id,
      position: 0,
      planPriceId: plan.planPriceId,
      taxableMinor: invoice.list ?? collectedFor(plan.tier, plan.cycle),
      rateBasisPoints: null,
    });
    return { id: issued.id, number };
  }

  async aCreditNote(held: HomeCompany, invoiceId: string, amount: MinorUnits, issuedAt: number) {
    const number = `CN/ZZ/${randomUUID().slice(0, NUMBER_SUFFIX)}`;
    const [note] = await this.pools.admin.db
      .insert(creditNote)
      .values({
        tenantId: held.tenantId,
        invoiceId,
        marketCode: 'ZZ',
        number,
        artefact: 'plain_credit_note',
        amountMinor: amount,
        currencyCode: 'INR',
        gatewayRefundRef: `rfnd_${randomUUID()}`,
        issuedAt: new Date(issuedAt),
      })
      .returning({ id: creditNote.id });
    if (note === undefined) throw new Error('the credit note was not written');
    return { id: note.id, number };
  }

  async aStateEntered(
    held: HomeCompany,
    state: BillingState,
    cause: SubscriptionCause,
    at: number,
  ) {
    const [row] = await this.pools.admin.db
      .insert(subscriptionStateHistory)
      .values({
        tenantId: held.tenantId,
        subscriptionId: held.subscriptionId,
        state,
        cause,
        enteredAt: new Date(at),
      })
      .returning({ id: subscriptionStateHistory.id });
    return row?.id ?? '';
  }

  async aNotice(
    held: HomeCompany,
    notice: BillingNotice,
    firedAt: number,
    cleared?: { readonly at: number; readonly paymentId: string },
  ) {
    await this.pools.admin.db.insert(dunningEvent).values({
      tenantId: held.tenantId,
      subscriptionId: held.subscriptionId,
      notice,
      dueAt: new Date(firedAt),
      firedAt: new Date(firedAt),
      clearedAt: cleared === undefined ? null : new Date(cleared.at),
      clearedByPayment: cleared?.paymentId ?? null,
    });
  }
}
