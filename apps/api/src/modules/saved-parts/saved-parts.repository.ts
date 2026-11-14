import type { SavedPartWrite } from '@heliogrid/contracts';
import { type DbTransaction, savedPart, type TenantPool } from '@heliogrid/db';
import type { AuditEventType, SavedPartKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, isNull, ne } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';

const partColumns = {
  id: savedPart.id,
  kind: savedPart.kind,
  brand: savedPart.brand,
  specification: savedPart.specification,
  warranty: savedPart.warranty,
  description: savedPart.description,
  archivedAt: savedPart.archivedAt,
};
export type SavedPartRow = Awaited<ReturnType<SavedPartsRepository['list']>>['rows'][number];

export interface SavedPartsAsk {
  readonly kind: SavedPartKind | undefined;
  readonly withArchived: boolean;
  readonly limit: number;
  readonly offset: number;
}

export type PartOutcome =
  | { readonly outcome: 'saved' | 'replayed'; readonly part: SavedPartRow }
  | { readonly outcome: 'key-reused' }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'duplicate'; readonly partId: string };

/**
 * The same part typed two ways is one part (`T-M06-034`): its brand and specification with case
 * and every space gone.
 */
export function matchKeyOf(part: Pick<SavedPartWrite, 'brand' | 'specification'>): string {
  const plain = (text: string) => text.toLowerCase().replace(/\s+/g, '');
  return `${plain(part.brand)}|${plain(part.specification)}`;
}

/**
 * The company's saved parts on the runtime pool (`M06-28`, `T-M06-034`): cable, electrical and
 * structure, each once. A live part with the same brand and specification is the part it is, so a
 * second is refused naming it; an archived one does not stand in the way.
 */
@Injectable()
export class SavedPartsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** One page of parts by kind, brand and id, and how many match the same `where`. */
  list(tenantId: string, ask: SavedPartsAsk) {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = and(
        eq(savedPart.tenantId, tenantId),
        ask.kind === undefined ? undefined : eq(savedPart.kind, ask.kind),
        ask.withArchived ? undefined : isNull(savedPart.archivedAt),
      );
      const rows = await tx
        .select(partColumns)
        .from(savedPart)
        .where(where)
        .orderBy(asc(savedPart.kind), asc(savedPart.brand), asc(savedPart.id))
        .limit(ask.limit)
        .offset(ask.offset);
      const [total] = await tx.select({ n: count() }).from(savedPart).where(where);
      return { rows, totalCount: total?.n ?? 0 };
    });
  }

  add(
    tenantId: string,
    kind: SavedPartKind,
    part: SavedPartWrite,
    key: CreationKey | null,
    act: Act,
  ): Promise<PartOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        const [made] = await tx
          .select({ ...partColumns, fingerprint: savedPart.creationFingerprint })
          .from(savedPart)
          .where(and(eq(savedPart.tenantId, tenantId), eq(savedPart.creationKey, key.key)));
        if (made !== undefined) {
          const { fingerprint, ...row } = made;
          return fingerprint === key.fingerprint
            ? { outcome: 'replayed', part: row }
            : { outcome: 'key-reused' };
        }
      }
      const matchKey = matchKeyOf(part);
      const twin = await liveTwin(tx, tenantId, kind, matchKey, null);
      if (twin !== null) return { outcome: 'duplicate', partId: twin };
      const now = new Date(act.now);
      const [row] = await tx
        .insert(savedPart)
        .values({
          tenantId,
          kind,
          ...part,
          matchKey,
          createdAt: now,
          createdBy: act.actorUserId,
          updatedAt: now,
          updatedBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning(partColumns);
      if (row === undefined) throw new Error('the saved part insert returned no row');
      await recorded(tx, 'saved_parts.part_added', tenantId, row.id, act);
      return { outcome: 'saved', part: row };
    });
  }

  /** The part's words replaced; proposals that already hold it keep their own copy. */
  save(tenantId: string, partId: string, part: SavedPartWrite, act: Act): Promise<PartOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await locked(tx, tenantId, partId);
      if (stored === null) return { outcome: 'not-found' };
      const matchKey = matchKeyOf(part);
      if (stored.archivedAt === null) {
        const twin = await liveTwin(tx, tenantId, stored.kind, matchKey, partId);
        if (twin !== null) return { outcome: 'duplicate', partId: twin };
      }
      const same =
        stored.brand === part.brand &&
        stored.specification === part.specification &&
        stored.warranty === part.warranty &&
        stored.description === part.description;
      if (same) return { outcome: 'saved', part: stored };
      const saved = await written(tx, tenantId, partId, { ...part, matchKey }, act);
      await recorded(tx, 'saved_parts.part_changed', tenantId, partId, act);
      return { outcome: 'saved', part: saved };
    });
  }

  /** In or out of the pickers: archived leaves them, restored returns unless its twin is live now. */
  setArchived(tenantId: string, partId: string, archived: boolean, act: Act): Promise<PartOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await locked(tx, tenantId, partId);
      if (stored === null) return { outcome: 'not-found' };
      if ((stored.archivedAt !== null) === archived) return { outcome: 'saved', part: stored };
      if (!archived) {
        const twin = await liveTwin(tx, tenantId, stored.kind, matchKeyOf(stored), partId);
        if (twin !== null) return { outcome: 'duplicate', partId: twin };
      }
      const archivedAt = archived ? new Date(act.now) : null;
      const saved = await written(tx, tenantId, partId, { archivedAt }, act);
      const event = archived ? 'saved_parts.part_archived' : 'saved_parts.part_restored';
      await recorded(tx, event, tenantId, partId, act);
      return { outcome: 'saved', part: saved };
    });
  }
}

/** A catalog change on the company's record (`F2-22`): the event names the whole change. */
function recorded(
  tx: DbTransaction,
  event: Extract<AuditEventType, `saved_parts.${string}`>,
  tenantId: string,
  partId: string,
  act: Act,
) {
  return recordAuditEntry(tx, memberAct(event, tenantId, { kind: 'saved_part', ref: partId }, act));
}

async function locked(tx: DbTransaction, tenantId: string, partId: string) {
  const [row] = await tx
    .select(partColumns)
    .from(savedPart)
    .where(and(eq(savedPart.tenantId, tenantId), eq(savedPart.id, partId)))
    .for('update');
  return row ?? null;
}

async function written(
  tx: DbTransaction,
  tenantId: string,
  partId: string,
  set: Partial<typeof savedPart.$inferInsert>,
  act: Act,
) {
  const [row] = await tx
    .update(savedPart)
    .set({ ...set, updatedAt: new Date(act.now), updatedBy: act.actorUserId })
    .where(and(eq(savedPart.tenantId, tenantId), eq(savedPart.id, partId)))
    .returning(partColumns);
  if (row === undefined) throw new Error(`saved part ${partId} vanished inside its own write`);
  return row;
}

/** Another live part of this kind with the same brand and specification, if one stands. */
async function liveTwin(
  tx: DbTransaction,
  tenantId: string,
  kind: SavedPartKind,
  matchKey: string,
  except: string | null,
): Promise<string | null> {
  const [twin] = await tx
    .select({ id: savedPart.id })
    .from(savedPart)
    .where(
      and(
        eq(savedPart.tenantId, tenantId),
        eq(savedPart.kind, kind),
        eq(savedPart.matchKey, matchKey),
        isNull(savedPart.archivedAt),
        except === null ? undefined : ne(savedPart.id, except),
      ),
    )
    .limit(1);
  return twin?.id ?? null;
}
