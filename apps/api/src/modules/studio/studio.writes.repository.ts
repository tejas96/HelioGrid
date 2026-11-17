import type { CreateDesign, SaveSite } from '@heliogrid/contracts';
import { type DbTransaction, design, type TenantPool } from '@heliogrid/db';
import { type DesignActRefusal, type DesignMount, isClosed } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, max, ne } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  applyLeadEdit,
  type LeadMoney,
  type LeadReader,
  leadWorkedOn,
  lockLeadInScope,
} from '../crm/crm.public';

export type CreateOutcome =
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'copy-not-found' }
  | { readonly outcome: 'refused'; readonly refusal: DesignActRefusal }
  | Keyed<string>;

export type SaveOutcome =
  | { readonly outcome: 'saved' }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'refused'; readonly refusal: DesignActRefusal };

/** The lead a design hangs on, in this company; `null` when there is no such design. */
async function leadIdOfDesign(
  tx: DbTransaction,
  tenantId: string,
  designId: string,
): Promise<string | null> {
  const [found] = await tx
    .select({ leadId: design.leadId })
    .from(design)
    .where(and(eq(design.tenantId, tenantId), eq(design.id, designId)));
  return found?.leadId ?? null;
}

/** The design an earlier send with this retry key made, or `null` when the key is new (`F4-07`). */
async function madeWith(
  tx: DbTransaction,
  tenantId: string,
  key: CreationKey,
): Promise<Keyed<string> | null> {
  const [made] = await tx
    .select({ id: design.id, fingerprint: design.creationFingerprint })
    .from(design)
    .where(and(eq(design.tenantId, tenantId), eq(design.creationKey, key.key)));
  return made === undefined ? null : replayOf(made.id, made.fingerprint, key);
}

/** Where the new design's panels go: a copy's as its source has them, else on the roof; `null` when the lead holds no such source. */
async function mountFor(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  copyOf: string | null,
): Promise<DesignMount | null> {
  if (copyOf === null) return 'roof';
  const [source] = await tx
    .select({ mount: design.mount })
    .from(design)
    .where(and(eq(design.tenantId, tenantId), eq(design.leadId, leadId), eq(design.id, copyOf)));
  return source?.mount ?? null;
}

/** Writes the lead's next design — the caller holds the lead's lock, so the number is its own. */
async function insertDesign(
  tx: DbTransaction,
  on: { readonly tenantId: string; readonly leadId: string },
  mount: DesignMount,
  copyOf: string | null,
  key: CreationKey | null,
  act: Act,
): Promise<string> {
  const [last] = await tx
    .select({ ordinal: max(design.ordinal) })
    .from(design)
    .where(and(eq(design.tenantId, on.tenantId), eq(design.leadId, on.leadId)));
  const now = new Date(act.now);
  const [made] = await tx
    .insert(design)
    .values({
      ...on,
      ordinal: (last?.ordinal ?? 0) + 1,
      mount,
      status: 'draft',
      recommended: false,
      duplicatedFrom: copyOf,
      createdAt: now,
      createdBy: act.actorUserId,
      updatedAt: now,
      updatedBy: act.actorUserId,
      creationKey: key?.key,
      creationFingerprint: key?.fingerprint,
    })
    .returning({ id: design.id });
  if (made === undefined) throw new Error('the design insert returned no row');
  return made.id;
}

/**
 * A design's writes on the runtime pool. Every write locks the design's lead first — the one lock
 * order a lead write takes — and reads its scope after the lock, so a lead that moved to someone
 * else while the write waited answers as no such design.
 */
@Injectable()
export class StudioWritesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The lead's next design: empty, or a copy of one of its designs. The lead's row lock makes the
   * number its own — two people starting at once get N and N+1 — and a closed lead takes none.
   */
  create(
    reader: LeadReader,
    leadId: string,
    body: CreateDesign,
    key: CreationKey | null,
    act: Act,
  ): Promise<CreateOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx): Promise<CreateOutcome> => {
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      const replay = key === null ? null : await madeWith(tx, tenantId, key);
      if (replay !== null) return replay;
      if (isClosed(locked.lifecycle)) return { outcome: 'refused', refusal: 'host_closed' };
      const mount = await mountFor(tx, tenantId, leadId, body.copyOf);
      if (mount === null) return { outcome: 'copy-not-found' };
      const made = await insertDesign(tx, { tenantId, leadId }, mount, body.copyOf, key, act);
      // Starting a design is work on its lead: a dormant one returns to its stage (`M02-49`).
      await leadWorkedOn(tx, tenantId, locked.customerId, leadId);
      return { outcome: 'created', row: made };
    });
  }

  /**
   * Site details, saved whole. The site's facts are the lead's, so they go through the lead's own
   * edit path — each changed one a timeline entry; where the panels go is the design's. Sent again
   * with what is stored, it writes nothing.
   */
  saveSite(
    reader: LeadReader,
    designId: string,
    body: SaveSite,
    money: LeadMoney,
    act: Act,
  ): Promise<SaveOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx): Promise<SaveOutcome> => {
      const leadId = await leadIdOfDesign(tx, tenantId, designId);
      if (leadId === null) return { outcome: 'not-found' };
      const locked = await lockLeadInScope(tx, reader, leadId);
      if (locked === null) return { outcome: 'not-found' };
      if (isClosed(locked.lifecycle)) return { outcome: 'refused', refusal: 'host_closed' };
      const { mount, capturedAt, name, address, pin, ...site } = body;
      const edit = { ...site, siteName: name, siteAddress: address, sitePin: pin };
      await applyLeadEdit(tx, reader, leadId, edit, new Date(capturedAt), money, act);
      await tx
        .update(design)
        .set({ mount, updatedAt: new Date(act.now), updatedBy: act.actorUserId })
        .where(
          and(eq(design.tenantId, tenantId), eq(design.id, designId), ne(design.mount, mount)),
        );
      return { outcome: 'saved' };
    });
  }

  /**
   * Marks the design as its lead's recommended one, or takes the mark off. A lead carries the mark
   * on one design at most, so the others lose it first. The lead whose designs changed, or `null`.
   */
  recommend(reader: LeadReader, designId: string, recommended: boolean): Promise<string | null> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const leadId = await leadIdOfDesign(tx, tenantId, designId);
      if (leadId === null || (await lockLeadInScope(tx, reader, leadId)) === null) return null;
      const ofLead = and(eq(design.tenantId, tenantId), eq(design.leadId, leadId));
      if (recommended) {
        await tx
          .update(design)
          .set({ recommended: false })
          .where(and(ofLead, eq(design.recommended, true), ne(design.id, designId)));
      }
      await tx
        .update(design)
        .set({ recommended })
        .where(and(ofLead, eq(design.id, designId), ne(design.recommended, recommended)));
      return leadId;
    });
  }
}
