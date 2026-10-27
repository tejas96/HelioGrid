import { isDeepStrictEqual } from 'node:util';
import {
  proposalTemplateSettings,
  type TenantPool,
  type TenantScopedDb,
  timelineTemplate,
  userAccount,
} from '@heliogrid/db';
import type {
  ProposalTemplateSettings,
  TimelinePhase,
  TimelineTemplateSettings,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { type LastSave, lastSaveOf } from './internal/wire';

/**
 * The proposal and timeline templates on the runtime pool (`M01-51`, `M01-52`): one row each,
 * absent until first saved, replaced whole on save — a save equal to what is stored writes and
 * records nothing (`F4-07`). The payment-term templates are `settings.tranches.repository.ts`'s.
 */
@Injectable()
export class SettingsTemplatesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async proposalTemplate(tenantId: string): Promise<ProposalTemplateSettings | null> {
    return this.db.withTenantTransaction(tenantId, (tx) => storedProposalTemplate(tx, tenantId));
  }

  async saveProposalTemplate(
    tenantId: string,
    settings: ProposalTemplateSettings,
    act: Act,
  ): Promise<ProposalTemplateSettings> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await storedProposalTemplate(tx, tenantId);
      if (stored !== null && isDeepStrictEqual(stored, settings)) return stored;
      const now = new Date(act.now);
      const values = {
        cover: settings.cover,
        sectionsIncluded: [...settings.sectionsIncluded],
        defaultTerms: settings.defaultTerms,
        updatedAt: now,
        updatedBy: act.actorUserId,
      };
      const [row] = await tx
        .insert(proposalTemplateSettings)
        .values({ tenantId, ...values })
        .onConflictDoUpdate({ target: proposalTemplateSettings.tenantId, set: values })
        .returning({ id: proposalTemplateSettings.id, ...proposalColumns() });
      if (!row) throw new Error('proposal_template_settings upsert returned no row');
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.proposal_template_changed',
          tenantId,
          { kind: 'proposal_template_settings', ref: row.id },
          act,
        ),
      );
      const { id: _id, ...saved } = row;
      return saved;
    });
  }

  /** Who saved the proposal template last, read apart from the template so the unchanged-save check and the effective read never see it. */
  async proposalTemplateLastSave(tenantId: string): Promise<LastSave | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [last] = await tx
        .select({
          at: proposalTemplateSettings.updatedAt,
          byId: proposalTemplateSettings.updatedBy,
          byName: userAccount.name,
        })
        .from(proposalTemplateSettings)
        .leftJoin(userAccount, eq(userAccount.id, proposalTemplateSettings.updatedBy))
        .where(eq(proposalTemplateSettings.tenantId, tenantId))
        .limit(1);
      return last === undefined ? null : lastSaveOf(last);
    });
  }

  /** Who saved the timeline last, read apart from the phases for the same reason. */
  async timelineTemplateLastSave(tenantId: string): Promise<LastSave | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [last] = await tx
        .select({
          at: timelineTemplate.updatedAt,
          byId: timelineTemplate.updatedBy,
          byName: userAccount.name,
        })
        .from(timelineTemplate)
        .leftJoin(userAccount, eq(userAccount.id, timelineTemplate.updatedBy))
        .where(eq(timelineTemplate.tenantId, tenantId))
        .limit(1);
      return last === undefined ? null : lastSaveOf(last);
    });
  }

  async timelineTemplate(tenantId: string): Promise<TimelineTemplateSettings | null> {
    return this.db.withTenantTransaction(tenantId, (tx) => storedTimelineTemplate(tx, tenantId));
  }

  async saveTimelineTemplate(
    tenantId: string,
    phases: readonly TimelinePhase[],
    act: Act,
  ): Promise<TimelineTemplateSettings> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await storedTimelineTemplate(tx, tenantId);
      if (stored !== null && isDeepStrictEqual(stored.phases, phases)) return stored;
      const now = new Date(act.now);
      const [row] = await tx
        .insert(timelineTemplate)
        .values({ tenantId, phases: [...phases], updatedAt: now, updatedBy: act.actorUserId })
        .onConflictDoUpdate({
          target: timelineTemplate.tenantId,
          set: { phases: [...phases], updatedAt: now, updatedBy: act.actorUserId },
        })
        .returning({ id: timelineTemplate.id, phases: timelineTemplate.phases });
      if (!row) throw new Error('timeline_template upsert returned no row');
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.timeline_template_changed',
          tenantId,
          { kind: 'timeline_template', ref: row.id },
          act,
        ),
      );
      return { phases: row.phases };
    });
  }
}

export async function storedProposalTemplate(
  tx: TenantScopedDb,
  tenantId: string,
): Promise<ProposalTemplateSettings | null> {
  const [row] = await tx
    .select(proposalColumns())
    .from(proposalTemplateSettings)
    .where(eq(proposalTemplateSettings.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

export async function storedTimelineTemplate(
  tx: TenantScopedDb,
  tenantId: string,
): Promise<TimelineTemplateSettings | null> {
  const [row] = await tx
    .select({ phases: timelineTemplate.phases })
    .from(timelineTemplate)
    .where(eq(timelineTemplate.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

function proposalColumns() {
  return {
    cover: proposalTemplateSettings.cover,
    sectionsIncluded: proposalTemplateSettings.sectionsIncluded,
    defaultTerms: proposalTemplateSettings.defaultTerms,
  };
}
