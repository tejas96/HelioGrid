import type { LeadDetail } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead, type TenantPool } from '@heliogrid/db';
import { isClosed, minorUnitsOfDecimal, roundPin } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { leadCustomerJoin } from './crm.lead-columns.repository';
import { loadLeadDetail } from './crm.lead-detail.repository';
import { lockLeadInScope } from './crm.lead-lock.repository';
import { leadScopeWhere } from './crm.scope.repository';
import { recordActivity } from './crm.timeline.repository';
import {
  type FieldChange,
  fieldChangesOf,
  fieldTextsOf,
  type LeadFieldEdit,
  sentTextsOf,
} from './internal/field-changes';
import type { LeadMoney } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

export type LeadEditOutcome =
  | { readonly outcome: 'done'; readonly detail: LeadDetail }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'closed' };

/**
 * Lead edits (`M02-36`, `F4-16`) on the runtime pool. The lead and then its customer are locked for
 * the edit (`lockLead`'s order), so two edits apply one after the other in the server's order —
 * never the device clock's — and the later one stands; every field an edit changes writes one
 * `field_change` entry.
 */
@Injectable()
export class CrmEditsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The fields sent, applied; `not-found` when the lead is not one the reader may act on, and
   * `closed` when it is closed and the edit sends more than do-not-call — a person can always stop
   * the calls (`M02-44`), but a closed lead's facts wait for a reopen.
   */
  async edit(
    reader: LeadReader,
    leadId: string,
    edit: LeadFieldEdit,
    capturedAt: Date,
    money: LeadMoney,
    act: Act,
  ): Promise<LeadEditOutcome> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx): Promise<LeadEditOutcome> => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      const onlyStopsCalls = Object.keys(edit).every((field) => field === 'doNotCall');
      if (isClosed(locked.lifecycle) && !onlyStopsCalls) return { outcome: 'closed' };
      const applied = await applyLeadEdit(tx, reader, leadId, edit, capturedAt, money, act);
      const detail = applied ? await loadLeadDetail(tx, reader, leadId, money) : null;
      return detail === null ? { outcome: 'not-found' } : { outcome: 'done', detail };
    });
  }
}

/**
 * One edit applied to a lead ALREADY LOCKED on the caller's transaction (`lockLead`): the fields
 * that change are written to the lead and its customer and each is one `field_change` entry. The
 * proposal builder's commit calls this too, so a site fact typed at a step is saved the way the
 * lead's own page saves it (`T-M06-032`). `false` when the lead is not one the reader may act on.
 */
export async function applyLeadEdit(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  edit: LeadFieldEdit,
  capturedAt: Date,
  money: LeadMoney,
  act: Act,
): Promise<boolean> {
  const { tenantId } = reader;
  const [stored] = await tx
    .select({
      customerId: lead.customerId,
      name: customer.name,
      city: customer.city,
      segment: lead.segment,
      monthlyBillMinor: lead.monthlyBillMinor,
      roofOwnership: lead.roofOwnership,
      roofType: lead.roofType,
      shading: lead.shading,
      timeline: lead.buyingTimeline,
      decisionMaker: lead.decisionMaker,
      preferredLanguage: customer.preferredLanguage,
      doNotCallSetAt: customer.doNotCallSetAt,
      siteAddress: lead.siteAddress,
      siteArea: lead.siteArea,
      siteDistrict: lead.siteDistrict,
      sanctionedLoadKw: lead.sanctionedLoadKw,
      supplyPhase: lead.supplyPhase,
      siteName: lead.siteName,
      siteLatitude: lead.siteLatitude,
      siteLongitude: lead.siteLongitude,
      utilityOperator: lead.siteUtility,
    })
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .where(
      and(
        eq(lead.tenantId, tenantId),
        eq(lead.id, leadId),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    )
    .for('no key update', { of: customer });
  if (stored === undefined) return false;
  const changes = fieldChangesOf(
    fieldTextsOf({ ...stored, doNotCall: stored.doNotCallSetAt !== null }, money.minorUnitDigits),
    sentTextsOf(edit, money.minorUnitDigits),
  );
  const changed = new Set(changes.map((change) => change.field));
  await applyToLead(tx, tenantId, leadId, edit, changed, money);
  await applyToCustomer(tx, tenantId, stored.customerId, edit, changed, act);
  await recordChanges(
    tx,
    { tenantId, customerId: stored.customerId, leadId },
    changes,
    capturedAt,
    act,
  );
  return true;
}

type Changed = ReadonlySet<FieldChange['field']>;

/** The lead's own facts the edit changed: the segment, the bill and the five qualifying chips. */
async function applyToLead(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  edit: LeadFieldEdit,
  changed: Changed,
  money: LeadMoney,
): Promise<void> {
  const set = {
    ...(changed.has('segment') && { segment: edit.segment ?? null }),
    ...(changed.has('monthlyBill') && {
      monthlyBillMinor:
        edit.monthlyBill == null
          ? null
          : minorUnitsOfDecimal(edit.monthlyBill, money.minorUnitDigits),
    }),
    ...(changed.has('roofOwnership') && { roofOwnership: edit.roofOwnership ?? null }),
    ...(changed.has('roofType') && { roofType: edit.roofType ?? null }),
    ...(changed.has('shading') && { shading: edit.shading ?? null }),
    ...(changed.has('timeline') && { buyingTimeline: edit.timeline ?? null }),
    ...(changed.has('decisionMaker') && { decisionMaker: edit.decisionMaker ?? null }),
    ...siteChanges(edit, changed),
  };
  if (Object.keys(set).length === 0) return;
  await tx
    .update(lead)
    .set(set)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
}

/** Where the system goes and its supply (`M06-09`, `M06-16`): the site facts the edit changed. */
function siteChanges(edit: LeadFieldEdit, changed: Changed) {
  return {
    ...(changed.has('siteAddress') && { siteAddress: edit.siteAddress ?? null }),
    ...(changed.has('area') && {
      siteArea: edit.area?.area ?? null,
      siteDistrict: edit.area?.district ?? null,
    }),
    ...(changed.has('sanctionedLoadKw') && { sanctionedLoadKw: edit.sanctionedLoadKw ?? null }),
    ...(changed.has('supplyPhase') && { supplyPhase: edit.supplyPhase ?? null }),
    ...studioSiteChanges(edit, changed),
  };
}

/** What the studio's Site details adds: the site's name, the roof's exact point and the operator. */
function studioSiteChanges(edit: LeadFieldEdit, changed: Changed) {
  // The pin is stored as it is recorded: rounded once, so what is saved is what is read back.
  const sitePin = edit.sitePin == null ? null : roundPin(edit.sitePin);
  return {
    ...(changed.has('siteName') && { siteName: edit.siteName ?? null }),
    ...(changed.has('sitePin') && {
      siteLatitude: sitePin?.latitude ?? null,
      siteLongitude: sitePin?.longitude ?? null,
    }),
    ...(changed.has('utilityOperator') && { siteUtility: edit.utilityOperator ?? null }),
  };
}

/** The customer's facts the edit changed: name, city, language and do-not-call (`M02-37`). */
async function applyToCustomer(
  tx: DbTransaction,
  tenantId: string,
  customerId: string,
  edit: LeadFieldEdit,
  changed: Changed,
  act: Act,
): Promise<void> {
  const doNotCall = edit.doNotCall === true;
  const set = {
    ...(changed.has('name') && { name: edit.name ?? null }),
    ...(changed.has('city') && { city: edit.city ?? null }),
    ...(changed.has('preferredLanguage') && { preferredLanguage: edit.preferredLanguage ?? null }),
    ...(changed.has('doNotCall') && {
      doNotCallSetAt: doNotCall ? new Date(act.now) : null,
      doNotCallSetBy: doNotCall ? act.actorUserId : null,
    }),
  };
  if (Object.keys(set).length === 0) return;
  await tx
    .update(customer)
    .set(set)
    .where(and(eq(customer.tenantId, tenantId), eq(customer.id, customerId)));
}

/** One `field_change` entry per applied change, with who, old, new and the device's moment. */
async function recordChanges(
  tx: DbTransaction,
  on: { tenantId: string; customerId: string; leadId: string },
  changes: readonly FieldChange[],
  capturedAt: Date,
  act: Act,
): Promise<void> {
  for (const change of changes) {
    await recordActivity(tx, {
      ...on,
      kind: 'field_change',
      body: change,
      actor: { kind: 'person', userId: act.actorUserId },
      capturedAt,
    });
  }
}
