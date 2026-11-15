import { type DbTransaction, projectTranche } from '@heliogrid/db';
import type { MinorUnits, SchedulePart, ScheduleSource } from '@heliogrid/domain';
import { splitSchedule } from '@heliogrid/domain/server';
import { defaultTermsOf } from './projects.won-basis.repository';

/**
 * A project's schedule, made ONCE at Mark won (ruling 2026-11-10): the final value split by the
 * company's default payment terms, inside the transaction that creates the project, so a project
 * never stands without the parts its terms promised. A company with no default terms gets no
 * parts, and the payments screen says so (`M11-15`). A deal won on an accepted proposal takes that
 * version's parts instead (`startScheduleFrom`).
 */
export async function startSchedule(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  payable: MinorUnits,
  now: Date,
): Promise<void> {
  const terms = await defaultTermsOf(tx, tenantId);
  if (terms.length === 0) return;
  await insertParts(tx, tenantId, projectId, splitSchedule(payable, terms), 'payment_terms', now);
}

/**
 * The schedule of a deal won on an accepted proposal (`M11-09`, `M07-62`): that version's own parts,
 * row for row and paisa for paisa — never split again, so the project asks exactly what the
 * customer agreed to.
 */
export async function startScheduleFrom(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  parts: readonly SchedulePart[],
  now: Date,
): Promise<void> {
  if (parts.length === 0) return;
  await insertParts(tx, tenantId, projectId, parts, 'proposal_version', now);
}

async function insertParts(
  tx: DbTransaction,
  tenantId: string,
  projectId: string,
  parts: readonly SchedulePart[],
  source: ScheduleSource,
  now: Date,
): Promise<void> {
  await tx.insert(projectTranche).values(
    parts.map((part, index) => ({
      tenantId,
      projectId,
      position: index + 1,
      label: part.label,
      shareBasisPoints: part.share,
      amountMinor: part.amount,
      dueOnStage: part.dueOnStage,
      source,
      createdAt: now,
    })),
  );
}
