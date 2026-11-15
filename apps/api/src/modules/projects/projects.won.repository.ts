import type { MarkWon } from '@heliogrid/contracts';
import {
  type DbTransaction,
  lead,
  project,
  projectStageTransition,
  type TenantPool,
  tenant,
} from '@heliogrid/db';
import {
  type CalendarDate,
  isPromisableInstallDate,
  isSubsidyAvailable,
  type LeadActRefusal,
  localDate,
  MARK_WON_VALUE_REFUSAL,
  type MarketPack,
  markWon,
  minorUnitsOfDecimal,
  PROJECT_MANAGER_PRESETS,
  PROPOSAL_TASK_PROVENANCES,
} from '@heliogrid/domain';
import { projectNumberOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, notInArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import { lockCounter, nextNumber } from '../../common/db/tenant-counter.repository';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import {
  closeTasksRaisedBy,
  type LeadReader,
  lockLeadInScope,
  personOf,
  recordActivity,
  recordLeadMoves,
} from '../crm/crm.public';
import type { AcceptedVersion } from '../proposals/proposals.public';
import { noticePartsNowDue, type PaymentNoticeWords } from './projects.payment-notices.repository';
import { allHold, customerNameOf } from './projects.people.repository';
import { startSchedule, startScheduleFrom } from './projects.schedule.repository';
import { seed } from './projects.seed.repository';
import {
  acceptedFor,
  markSignedProposalDone,
  planOfVersion,
} from './projects.won-basis.repository';

export type MarkWonOutcome =
  | {
      readonly outcome: 'done' | 'replayed';
      readonly projectId: string;
      readonly number: string;
      /** The notices of the parts due at Won, for their push after the commit. */
      readonly notified?: readonly string[];
    }
  | { readonly outcome: 'key-reused' }
  | {
      readonly outcome: 'refused';
      readonly refusal: LeadActRefusal | typeof MARK_WON_VALUE_REFUSAL;
    }
  | { readonly outcome: 'not-a-manager' }
  | { readonly outcome: 'install-date-past' }
  | { readonly outcome: 'over-limit' }
  | { readonly outcome: 'not-found' };

/**
 * *Mark won* (`M07-62`, `M08-02`…`M08-05`): the lead moves to Won and its project is created in
 * the SAME transaction — numbered from the company's own counter, seeded once from the pack in
 * force, pointing at the lead and its customer and copying neither. The lead is locked first, as
 * every CRM write is, so two people winning one deal make one project.
 *
 * The accepted proposal is found from the lead itself (`T-M06-025`, `F4-04`): where the customer
 * accepted the latest shared version, the final value MUST be that version's payable and the
 * schedule is that version's own plan; otherwise the typed value and the company's terms stand.
 */
@Injectable()
export class ProjectsWonRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  markWon(
    reader: LeadReader,
    leadId: string,
    body: MarkWon,
    pack: MarketPack,
    packVersion: string,
    activeLimit: number | null,
    act: Act,
    key: CreationKey | null,
    words: PaymentNoticeWords,
  ): Promise<MarkWonOutcome> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      const replay = key === null ? null : await madeWith(tx, reader.tenantId, key);
      if (replay !== null) return replay;
      await lockCounter(tx, reader.tenantId, 'project');
      const today = await todayOf(tx, reader.tenantId, act);
      if (!isPromisableInstallDate(body.expectedInstallOn, today)) {
        return { outcome: 'install-date-past' };
      }
      const refused = await refusalOf(tx, reader.tenantId, body.managerId, activeLimit);
      if (refused !== null) return refused;
      const result = markWon(locked.lifecycle);
      if (result.kind === 'refused') return { outcome: 'refused', refusal: result.refusal };
      const typed = minorUnitsOfDecimal(body.finalValue, pack.formats.minorUnitDigits);
      const stands = await acceptedFor(tx, reader.tenantId, leadId, typed);
      if (stands === 'value-differs') {
        return { outcome: 'refused', refusal: MARK_WON_VALUE_REFUSAL };
      }
      const accepted = stands;
      const capturedAt = new Date(body.capturedAt);
      await recordLeadMoves(tx, locked, result, personOf(act), capturedAt);
      // The deal is decided: no proposal follow-up, confirm-won or declined task stays open (`M06-55`).
      await closeTasksRaisedBy(tx, reader.tenantId, leadId, PROPOSAL_TASK_PROVENANCES);
      const created = await startProject(tx, {
        accepted,
        tenantId: reader.tenantId,
        leadId,
        customerId: locked.customerId,
        body,
        pack,
        packVersion,
        act,
        key,
        today,
      });
      await recordAuditEntry(
        tx,
        memberAct(
          'projects.project_won',
          reader.tenantId,
          { kind: 'project', ref: created.id },
          act,
        ),
      );
      await recordActivity(tx, {
        tenantId: reader.tenantId,
        customerId: locked.customerId,
        leadId,
        kind: 'project_moved',
        body: { projectId: created.id, from: null, to: 'won', cause: 'person', proof: null },
        actor: personOf(act),
        capturedAt,
      });
      const notified = await noticePartsNowDue(
        tx,
        {
          tenantId: reader.tenantId,
          projectId: created.id,
          managerId: body.managerId,
          name: await customerNameOf(tx, reader.tenantId, locked.customerId),
        },
        new Date(act.now),
        words,
      );
      return {
        outcome: 'done',
        projectId: created.id,
        number: projectNumberOf(created.number),
        notified,
      };
    });
  }
}

/** Why this Won may not start a project: no one to manage it, or the plan's live projects in use. */
async function refusalOf(
  tx: DbTransaction,
  tenantId: string,
  managerId: string,
  activeLimit: number | null,
): Promise<MarkWonOutcome | null> {
  if (!(await allHold(tx, tenantId, [managerId], PROJECT_MANAGER_PRESETS))) {
    return { outcome: 'not-a-manager' };
  }
  if (activeLimit !== null && (await activeCount(tx, tenantId)) >= activeLimit) {
    return { outcome: 'over-limit' };
  }
  return null;
}

interface ProjectStart {
  readonly tenantId: string;
  readonly leadId: string;
  readonly customerId: string;
  readonly body: MarkWon;
  readonly pack: MarketPack;
  readonly packVersion: string;
  readonly act: Act;
  readonly key: CreationKey | null;
  /** The company's day the deal was won — the day Won began. */
  readonly today: CalendarDate;
  /** The version the customer accepted, where Won stands on one. */
  readonly accepted: AcceptedVersion | null;
}

/** The company's day at the act's moment. */
async function todayOf(tx: DbTransaction, tenantId: string, act: Act): Promise<CalendarDate> {
  const [own] = await tx
    .select({ timeZone: tenant.timezone })
    .from(tenant)
    .where(eq(tenant.id, tenantId));
  if (own === undefined) throw new Error(`no company ${tenantId} to win a deal for`);
  return localDate(act.now, own.timeZone);
}

/** The project itself, at Won: its number, its seeded checklist and steps, its first move. */
async function startProject(
  tx: DbTransaction,
  start: ProjectStart,
): Promise<{ id: string; number: number }> {
  const { tenantId, leadId, body, pack, act, key } = start;
  const [deal] = await tx
    .select({ segment: lead.segment, ownerUserId: lead.ownerUserId })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  if (deal === undefined) throw new Error(`lead ${leadId} vanished inside Mark won`);
  // A deal with no segment yet is read as residential: the incentive path then stays open, and
  // a person marks its row Not needed where it does not apply.
  const segment = deal.segment ?? 'residential';
  const number = await nextNumber(tx, tenantId, 'project');
  const now = new Date(act.now);
  const finalValueMinor = minorUnitsOfDecimal(body.finalValue, pack.formats.minorUnitDigits);
  const [created] = await tx
    .insert(project)
    .values({
      tenantId,
      number,
      leadId,
      customerId: start.customerId,
      stage: 'won',
      stageEnteredAt: now,
      managerId: body.managerId,
      soldBy: deal.ownerUserId,
      expectedInstallOn: body.expectedInstallOn,
      finalValueMinor,
      packVersion: start.packVersion,
      proposalVersionId: start.accepted?.versionId ?? null,
      incentiveApplies: isSubsidyAvailable(pack.subsidy, segment),
      createdAt: now,
      createdBy: act.actorUserId,
      creationKey: key?.key,
      creationFingerprint: key?.fingerprint,
    })
    .returning({ id: project.id });
  if (created === undefined) throw new Error('the project insert returned no row');
  await seed(tx, tenantId, created.id, pack, segment, now);
  if (start.accepted === null) {
    await startSchedule(tx, tenantId, created.id, finalValueMinor, now);
  } else {
    await startScheduleFrom(tx, tenantId, created.id, planOfVersion(start.accepted.snapshot), now);
    await markSignedProposalDone(tx, tenantId, created.id, start.accepted.acceptedAt);
  }
  await tx.insert(projectStageTransition).values({
    tenantId,
    projectId: created.id,
    fromStage: null,
    toStage: 'won',
    cause: 'person',
    proof: null,
    movedAt: now,
    enteredOn: start.today,
    movedBy: act.actorUserId,
  });
  return { id: created.id, number };
}

/**
 * A retry of the same Won (`F4-07`): the project an earlier send with this key made — the same
 * request answered again, or, for another request under that key, the key's refusal.
 */
async function madeWith(
  tx: DbTransaction,
  tenantId: string,
  key: CreationKey,
): Promise<MarkWonOutcome | null> {
  const [made] = await tx
    .select({ id: project.id, number: project.number, fingerprint: project.creationFingerprint })
    .from(project)
    .where(and(eq(project.tenantId, tenantId), eq(project.creationKey, key.key)));
  if (made === undefined) return null;
  return made.fingerprint === key.fingerprint
    ? { outcome: 'replayed', projectId: made.id, number: projectNumberOf(made.number) }
    : { outcome: 'key-reused' };
}

/** The company's active projects (`M08-07`) — what the plan limit counts. */
async function activeCount(tx: DbTransaction, tenantId: string): Promise<number> {
  const [row] = await tx
    .select({ count: count() })
    .from(project)
    .where(
      and(eq(project.tenantId, tenantId), notInArray(project.stage, ['handed_over', 'cancelled'])),
    );
  return row?.count ?? 0;
}
