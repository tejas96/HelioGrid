import { randomUUID } from 'node:crypto';
import { type Db, otpChallenge } from '@heliogrid/db';
import { hashCode } from '../../src/modules/auth/internal/otp.service';

/**
 * A sign-in code request as the store holds it, with its code known to the proof: the code is
 * hashed exactly as the api hashes it. Live unless the case sets it verified, invalidated, old or
 * already missed.
 */
export interface Challenge {
  readonly challengeId: string;
  readonly phoneE164: string;
  readonly code: string;
  readonly issuedAt: number;
  readonly failedVerifies: number;
  readonly verifiedAt?: number;
  readonly invalidatedAt?: number;
}

export const aChallenge = (
  phoneE164: string,
  code: string,
  standing: Partial<Omit<Challenge, 'challengeId' | 'phoneE164' | 'code'>> = {},
): Challenge => ({
  challengeId: randomUUID(),
  phoneE164,
  code,
  issuedAt: standing.issuedAt ?? Date.now(),
  failedVerifies: standing.failedVerifies ?? 0,
  verifiedAt: standing.verifiedAt,
  invalidatedAt: standing.invalidatedAt,
});

export async function seedChallenges(db: Db, challenges: readonly Challenge[]): Promise<void> {
  await db.insert(otpChallenge).values(
    challenges.map((challenge) => ({
      id: challenge.challengeId,
      phoneE164: challenge.phoneE164,
      codeHash: hashCode(challenge.phoneE164, challenge.code),
      channel: 'sms' as const,
      issuedAt: new Date(challenge.issuedAt),
      failedVerifies: challenge.failedVerifies,
      verifiedAt: challenge.verifiedAt === undefined ? null : new Date(challenge.verifiedAt),
      invalidatedAt:
        challenge.invalidatedAt === undefined ? null : new Date(challenge.invalidatedAt),
    })),
  );
}
