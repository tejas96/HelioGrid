import {
  type Db,
  trancheTemplate,
  trancheTemplateLine,
  withTenantTransaction,
} from '@heliogrid/db';
import {
  basisPoints,
  isTrancheDueStage,
  type ProjectChainStage,
  type TrancheTemplate,
  type TrancheTemplateContent,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { RUNTIME_DB } from '../../common/db/runtime.token';
import { recordAuditEntry } from '../audit/audit.public';
import { settingsAct } from './internal/audit-act';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export type TemplateOutcome =
  | { readonly outcome: 'done'; readonly template: TrancheTemplate }
  | { readonly outcome: 'not-found' | 'archived' | 'is-default' };

/**
 * The named payment-term templates on the runtime pool (`M01-54`): a list that archives and
 * never deletes, with exactly one default the database holds. The sum rule is judged before
 * anything reaches here; a line lands only as part of a whole template.
 */
@Injectable()
export class SettingsTranchesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  async trancheTemplates(tenantId: string): Promise<readonly TrancheTemplate[]> {
    return withTenantTransaction(this.db, tenantId, (tx) => trancheTemplatesOf(tx, tenantId));
  }

  /**
   * A new named template, never the default — unless the tenant holds no live default at all,
   * which only a company older than the seed can be; then the first one it makes is.
   */
  async createTrancheTemplate(
    tenantId: string,
    content: TrancheTemplateContent,
    act: Act,
  ): Promise<TrancheTemplate> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const [current] = await tx
        .select({ id: trancheTemplate.id })
        .from(trancheTemplate)
        .where(
          and(
            eq(trancheTemplate.tenantId, tenantId),
            eq(trancheTemplate.isDefault, true),
            eq(trancheTemplate.archived, false),
          ),
        )
        .limit(1);
      const [row] = await tx
        .insert(trancheTemplate)
        .values({
          tenantId,
          name: content.name,
          isDefault: current === undefined,
          archived: false,
          createdAt: new Date(act.now),
          changedAt: new Date(act.now),
        })
        .returning({ id: trancheTemplate.id });
      if (!row) throw new Error('tranche_template insert returned no row');
      await writeLines(tx, tenantId, row.id, content);
      await recordAuditEntry(
        tx,
        settingsAct(
          'settings.tranche_template_created',
          tenantId,
          { kind: 'tranche_template', ref: row.id },
          act,
        ),
      );
      return templateById(tx, tenantId, row.id);
    });
  }

  /** The name and the lines replaced; an archived template is history and refuses the edit. */
  async saveTrancheTemplate(
    tenantId: string,
    id: string,
    content: TrancheTemplateContent,
    act: Act,
  ): Promise<TemplateOutcome> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const standing = await standingOf(tx, tenantId, id);
      if (standing === null) return { outcome: 'not-found' };
      if (standing.archived) return { outcome: 'archived' };
      await tx
        .update(trancheTemplate)
        .set({ name: content.name, changedAt: new Date(act.now) })
        .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, id)));
      await tx
        .delete(trancheTemplateLine)
        .where(
          and(
            eq(trancheTemplateLine.tenantId, tenantId),
            eq(trancheTemplateLine.trancheTemplateId, id),
          ),
        );
      await writeLines(tx, tenantId, id, content);
      await recordAuditEntry(
        tx,
        settingsAct(
          'settings.tranche_template_changed',
          tenantId,
          { kind: 'tranche_template', ref: id },
          act,
        ),
      );
      return { outcome: 'done', template: await templateById(tx, tenantId, id) };
    });
  }

  /** Archived, never deleted; the default stays live until another is made default. */
  async archiveTrancheTemplate(tenantId: string, id: string, act: Act): Promise<TemplateOutcome> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const standing = await standingOf(tx, tenantId, id);
      if (standing === null) return { outcome: 'not-found' };
      if (standing.archived) return { outcome: 'archived' };
      if (standing.isDefault) return { outcome: 'is-default' };
      await tx
        .update(trancheTemplate)
        .set({ archived: true, archivedAt: new Date(act.now) })
        .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, id)));
      await recordAuditEntry(
        tx,
        settingsAct(
          'settings.tranche_template_archived',
          tenantId,
          { kind: 'tranche_template', ref: id },
          act,
        ),
      );
      return { outcome: 'done', template: await templateById(tx, tenantId, id) };
    });
  }

  /** The one default moves: the old one steps down first, so the partial unique key never sees two. */
  async makeDefaultTrancheTemplate(
    tenantId: string,
    id: string,
    act: Act,
  ): Promise<TemplateOutcome> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const standing = await standingOf(tx, tenantId, id);
      if (standing === null) return { outcome: 'not-found' };
      if (standing.archived) return { outcome: 'archived' };
      if (!standing.isDefault) {
        await tx
          .update(trancheTemplate)
          .set({ isDefault: false })
          .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.isDefault, true)));
        await tx
          .update(trancheTemplate)
          .set({ isDefault: true })
          .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, id)));
        await recordAuditEntry(
          tx,
          settingsAct(
            'settings.tranche_template_default_changed',
            tenantId,
            { kind: 'tranche_template', ref: id },
            act,
          ),
        );
      }
      return { outcome: 'done', template: await templateById(tx, tenantId, id) };
    });
  }
}

async function standingOf(
  tx: Tx,
  tenantId: string,
  id: string,
): Promise<{ archived: boolean; isDefault: boolean } | null> {
  const [row] = await tx
    .select({ archived: trancheTemplate.archived, isDefault: trancheTemplate.isDefault })
    .from(trancheTemplate)
    .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, id)))
    .limit(1);
  return row ?? null;
}

async function writeLines(
  tx: Tx,
  tenantId: string,
  templateId: string,
  content: TrancheTemplateContent,
): Promise<void> {
  await tx.insert(trancheTemplateLine).values(
    content.lines.map((line, position) => ({
      tenantId,
      trancheTemplateId: templateId,
      position,
      label: line.label,
      shareBasisPoints: line.share,
      dueOnStage: line.dueOnStage,
    })),
  );
}

async function templateById(tx: Tx, tenantId: string, id: string): Promise<TrancheTemplate> {
  const [template] = await trancheTemplatesOf(tx, tenantId, id);
  if (!template) throw new Error('the tranche template vanished inside its own transaction');
  return template;
}

/**
 * Every template with its lines in order, oldest first — or one template by id. Two reads
 * over the tenant index, never one per template. `dueOnStage` is stored text validated on the
 * way in, so it reads back as the chain stage it was written as.
 */
export async function trancheTemplatesOf(
  tx: Tx,
  tenantId: string,
  onlyId?: string,
): Promise<readonly TrancheTemplate[]> {
  const rows = await tx
    .select({
      id: trancheTemplate.id,
      name: trancheTemplate.name,
      isDefault: trancheTemplate.isDefault,
      archived: trancheTemplate.archived,
      changedAt: trancheTemplate.changedAt,
    })
    .from(trancheTemplate)
    .where(
      onlyId === undefined
        ? eq(trancheTemplate.tenantId, tenantId)
        : and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, onlyId)),
    )
    .orderBy(asc(trancheTemplate.createdAt), asc(trancheTemplate.id));
  const ids = rows.map((row) => row.id);
  const lines =
    ids.length === 0
      ? []
      : await tx
          .select({
            trancheTemplateId: trancheTemplateLine.trancheTemplateId,
            position: trancheTemplateLine.position,
            label: trancheTemplateLine.label,
            shareBasisPoints: trancheTemplateLine.shareBasisPoints,
            dueOnStage: trancheTemplateLine.dueOnStage,
          })
          .from(trancheTemplateLine)
          .where(
            and(
              eq(trancheTemplateLine.tenantId, tenantId),
              inArray(trancheTemplateLine.trancheTemplateId, ids),
            ),
          )
          .orderBy(asc(trancheTemplateLine.position));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    archived: row.archived,
    changed: row.changedAt !== null,
    lines: lines
      .filter((line) => line.trancheTemplateId === row.id)
      .map((line) => ({
        label: line.label,
        share: basisPoints(line.shareBasisPoints),
        dueOnStage: dueStageOf(line.dueOnStage),
      })),
  }));
}

/** A stored stage was validated on the way in; a value outside the chain is a corrupted row, said loudly. */
function dueStageOf(stored: string): ProjectChainStage {
  if (!isTrancheDueStage(stored)) throw new Error(`tranche line bound to unknown stage ${stored}`);
  return stored;
}
