import { isDeepStrictEqual } from 'node:util';
import {
  type TenantPool,
  type TenantScopedDb,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import type { TrancheTemplate, TrancheTemplateContent } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import type { LastSave } from './internal/wire';
import { trancheTemplatesLastSave, trancheTemplatesOf } from './settings.tranche-reads.repository';

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
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Every template, and the newest create or save among them, read in one transaction. */
  async trancheTemplates(
    tenantId: string,
  ): Promise<{ templates: readonly TrancheTemplate[]; lastSave: LastSave | null }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => ({
      templates: await trancheTemplatesOf(tx, tenantId),
      lastSave: await trancheTemplatesLastSave(tx, tenantId),
    }));
  }

  /**
   * A new named template, never the default — unless the tenant holds no live default at all,
   * which only a company older than the seed can be; then the first one it makes is. A send
   * retried with its key answers with the template the first send made (`F4-07`).
   */
  async createTrancheTemplate(
    tenantId: string,
    content: TrancheTemplateContent,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<TrancheTemplate>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: trancheTemplate.id, fingerprint: trancheTemplate.creationFingerprint })
          .from(trancheTemplate)
          .where(
            and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.creationKey, key.key)),
          )
          .limit(1);
        if (made) return replayOf(await templateById(tx, tenantId, made.id), made.fingerprint, key);
      }
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
          changedBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning({ id: trancheTemplate.id });
      if (!row) throw new Error('tranche_template insert returned no row');
      await writeLines(tx, tenantId, row.id, content);
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.tranche_template_created',
          tenantId,
          { kind: 'tranche_template', ref: row.id },
          act,
        ),
      );
      return { outcome: 'created', row: await templateById(tx, tenantId, row.id) };
    });
  }

  /** The name and the lines replaced; an archived template is history and refuses the edit. */
  async saveTrancheTemplate(
    tenantId: string,
    id: string,
    content: TrancheTemplateContent,
    act: Act,
  ): Promise<TemplateOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const [stored] = await trancheTemplatesOf(tx, tenantId, id);
      if (stored === undefined) return { outcome: 'not-found' };
      if (stored.archived) return { outcome: 'archived' };
      // The content as stored, sent again, writes and records nothing (`F4-07`).
      const { name, lines } = stored;
      if (isDeepStrictEqual({ name, lines }, content)) return { outcome: 'done', template: stored };
      await tx
        .update(trancheTemplate)
        .set({ name: content.name, changedAt: new Date(act.now), changedBy: act.actorUserId })
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
        memberAct(
          'settings.tranche_template_changed',
          tenantId,
          { kind: 'tranche_template', ref: id },
          act,
        ),
      );
      return { outcome: 'done', template: await templateById(tx, tenantId, id) };
    });
  }

  /**
   * Archived, never deleted; the default stays live until another is made default. Archiving an
   * archived template is the same act repeated — a retry — and answers the template, writing
   * nothing (`F4-07`).
   */
  async archiveTrancheTemplate(tenantId: string, id: string, act: Act): Promise<TemplateOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      // The tenant lock BEFORE the standing is read, as save and make-default take it: two
      // archives at once would otherwise both read "live" and both record the act.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const [stored] = await trancheTemplatesOf(tx, tenantId, id);
      if (stored === undefined) return { outcome: 'not-found' };
      if (stored.archived) return { outcome: 'done', template: stored };
      if (stored.isDefault) return { outcome: 'is-default' };
      await tx
        .update(trancheTemplate)
        .set({ archived: true, archivedAt: new Date(act.now) })
        .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, id)));
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.tranche_template_archived',
          tenantId,
          { kind: 'tranche_template', ref: id },
          act,
        ),
      );
      return { outcome: 'done', template: await templateById(tx, tenantId, id) };
    });
  }

  /**
   * Back in use, never as the default: the template keeps its place by creation. Restoring one
   * already in use is the same act repeated — a retry — and answers it, writing nothing (`F4-07`).
   */
  async restoreTrancheTemplate(tenantId: string, id: string, act: Act): Promise<TemplateOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const [stored] = await trancheTemplatesOf(tx, tenantId, id);
      if (stored === undefined) return { outcome: 'not-found' };
      if (!stored.archived) return { outcome: 'done', template: stored };
      await tx
        .update(trancheTemplate)
        .set({ archived: false, archivedAt: null })
        .where(and(eq(trancheTemplate.tenantId, tenantId), eq(trancheTemplate.id, id)));
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.tranche_template_restored',
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
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`);
      const [stored] = await trancheTemplatesOf(tx, tenantId, id);
      if (stored === undefined) return { outcome: 'not-found' };
      if (stored.archived) return { outcome: 'archived' };
      if (!stored.isDefault) {
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
          memberAct(
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

async function writeLines(
  tx: TenantScopedDb,
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

async function templateById(
  tx: TenantScopedDb,
  tenantId: string,
  id: string,
): Promise<TrancheTemplate> {
  const [template] = await trancheTemplatesOf(tx, tenantId, id);
  if (!template) throw new Error('the tranche template vanished inside its own transaction');
  return template;
}
