import { type DbTransaction, membershipRole, tenantMembership, userAccount } from '@heliogrid/db';
import {
  type Capability,
  can,
  FOUNDER_ROLE,
  NOTIFICATION_REGISTRY,
  type NotificationRecipientRule,
  type NotificationType,
  type RolePreset,
} from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import type { NoticeRecipient } from './notification.repository';

/**
 * The people a notice's subject names, for the recipient rules to read (`F6-05`): its owner, its
 * assignee where that is someone else, and the act it waits on for the capability holders. A rule
 * whose fact is `null` matches nobody.
 */
export interface NoticeSubjectPeople {
  readonly ownerUserId: string | null;
  readonly assigneeUserId: string | null;
  readonly awaits: Capability | null;
}

/** An active member a rule matched, with the presets that decide what they may read. */
export interface NoticeCandidate extends NoticeRecipient {
  readonly roles: readonly RolePreset[];
}

/**
 * Whether this person may read the notice's subject. A notice names its subject, so one sent to a
 * person who may not open it would hand them what their scope withholds.
 */
export type MayRead = (candidate: NoticeCandidate) => Promise<boolean>;

/** Each rule as the members it matches — a `Record`, so a new rule fails to compile until read. */
const RULE_MATCHES: Readonly<
  Record<
    NotificationRecipientRule,
    (member: NoticeCandidate, people: NoticeSubjectPeople) => boolean
  >
> = {
  subject_owner: (member, people) => member.userId === people.ownerUserId,
  subject_assignee: (member, people) => member.userId === people.assigneeUserId,
  capability_holders: (member, people) =>
    people.awaits !== null && can(member.roles, people.awaits),
  epc_owner: (member) => member.roles.includes(FOUNDER_ROLE),
};

/** The company's active members with their presets — a team, so one bounded read. */
async function activeMembersOf(tx: DbTransaction, tenantId: string): Promise<NoticeCandidate[]> {
  const rows = await tx
    .select({
      userId: userAccount.id,
      language: userAccount.interfaceLanguage,
      role: membershipRole.rolePreset,
    })
    .from(membershipRole)
    .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(and(eq(membershipRole.tenantId, tenantId), eq(tenantMembership.status, 'active')));
  const members = new Map<string, NoticeCandidate>();
  for (const row of rows) {
    const known = members.get(row.userId);
    members.set(row.userId, {
      userId: row.userId,
      language: row.language,
      roles: [...(known?.roles ?? []), row.role],
    });
  }
  return [...members.values()];
}

/**
 * Who a notice of this type goes to (`F6-05`, T-FPLAT-066): every active member any of its
 * registered rules matches and who may read its subject, each ONCE — and the EPC Owner when no
 * one remains, so a notice never lands on nobody. Runs on the caller's transaction, beside the
 * write that earned the notice; either pool's will do, so the tenant is named in the query.
 */
export async function recipientsFor(
  tx: DbTransaction,
  tenantId: string,
  type: NotificationType,
  people: NoticeSubjectPeople,
  mayRead: MayRead,
): Promise<NoticeRecipient[]> {
  const members = await activeMembersOf(tx, tenantId);
  const rules = NOTIFICATION_REGISTRY[type].recipients;
  const matched = members.filter((member) =>
    rules.some((rule) => RULE_MATCHES[rule](member, people)),
  );
  const readers: NoticeRecipient[] = [];
  for (const member of matched) {
    if (await mayRead(member)) readers.push({ userId: member.userId, language: member.language });
  }
  if (readers.length > 0) return readers;
  return members
    .filter((member) => RULE_MATCHES.epc_owner(member, people))
    .map(({ userId, language }) => ({ userId, language }));
}
