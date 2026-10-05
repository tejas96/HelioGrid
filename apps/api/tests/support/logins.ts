import { authIdentity, type Db } from '@heliogrid/db';

/** A seeded person who may hold a linked Google login (`M01-02`). */
interface MaybeLinked {
  readonly userId: string;
  readonly googleSubject?: string;
}

/** Each person's linked login becomes an `auth_identity` row; a person without one adds none. */
export async function seedLinkedLogins(
  db: Db,
  people: readonly MaybeLinked[],
  now: Date,
): Promise<void> {
  const linked = people.flatMap(({ userId, googleSubject: subject }) =>
    subject === undefined
      ? []
      : [{ userAccountId: userId, provider: 'google' as const, subject, createdAt: now }],
  );
  if (linked.length > 0) await db.insert(authIdentity).values(linked);
}
