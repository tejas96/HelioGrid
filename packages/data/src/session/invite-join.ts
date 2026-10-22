import type {
  InviteFacts,
  InviteJoinOutcome,
  InviteJoinResult,
  OtpVerifyOutcome,
  SessionUser,
} from '@heliogrid/domain';
import type { InvitationRepository } from '../invitation/repository';
import type { FirstRunHold } from './first-run';
import { codeOf, userOf } from './wire-answers';

/** A code checked against the challenge the store opened: the account it proves, or the refusal. */
export type CodeCheck =
  | { readonly kind: 'verified'; readonly user: SessionUser }
  | {
      readonly kind: 'refused';
      readonly outcome: Exclude<OtpVerifyOutcome, 'verified'>;
      readonly triesLeft: number;
    };

/** What the store lends the join: the code check that admits nothing, and the admission itself. */
export interface InviteJoinDeps {
  readonly invitation: InvitationRepository;
  checkCode(code: string): Promise<CodeCheck>;
  admit(user: SessionUser): Promise<void>;
  /** Where the join leaves First-Run Profile for an account it named from the invite. */
  readonly firstRun: FirstRunHold;
}

/** What the landing read of the invite that the step after the join names. */
export type JoinedInvite = Pick<InviteFacts, 'inviterName' | 'companyName'>;

export interface InviteJoin {
  joinWithInvite(token: string, code: string, invite: JoinedInvite): Promise<InviteJoinResult>;
  retryJoin(token: string): Promise<InviteJoinOutcome>;
}

/**
 * The invite's one act (`M01-13`): the code, then the join, and only then the session. A verified
 * number with no company is admitted nowhere — admitted first, it would land on company signup
 * (`landingFor`) before the membership exists. So the verified account waits here, unadmitted,
 * until the accept answers: a member's session is admitted, and a join that fails keeps the
 * account held for `retryJoin`, which sends the accept alone.
 *
 * An account that had no name before the accept took the invite's: only that person is owed
 * First-Run Profile, held before the admission so the screen that follows finds it (ruling 18).
 */
export function createInviteJoin(deps: InviteJoinDeps): InviteJoin {
  let verified: SessionUser | null = null;
  /** The invite a newly named account joined by; `null` for an account that had its own name. */
  let namedBy: JoinedInvite | null = null;

  /** `CONFLICT` is a person already on that team: the verified account is theirs to enter. */
  const accept = async (token: string): Promise<InviteJoinOutcome> => {
    try {
      // Held until admitted: an admission that throws leaves a member, and the retry's CONFLICT admits them.
      verified = userOf(await deps.invitation.accept(token));
      if (namedBy !== null) {
        deps.firstRun.hold(verified.id, { ...namedBy, name: verified.name });
      }
      await deps.admit(verified);
      verified = null;
      return 'joined';
    } catch (error) {
      const code = codeOf(error);
      if (code === 'INVITE_EXPIRED') {
        verified = null;
        return 'expired';
      }
      if (code === 'CONFLICT' && verified !== null) return admitHeld(verified);
      return 'failed';
    }
  };

  /** Already on the team: the held account is theirs to enter; an admission that throws is a failed join, never a hang. */
  const admitHeld = async (member: SessionUser): Promise<InviteJoinOutcome> => {
    try {
      await deps.admit(member);
      verified = null;
      return 'joined';
    } catch {
      return 'failed';
    }
  };

  return {
    async joinWithInvite(token, code, invite) {
      // A step left unfinished belongs to the join that owed it, never to this one.
      deps.firstRun.end();
      const check = await deps.checkCode(code);
      if (check.kind === 'refused') {
        return { step: 'code', outcome: check.outcome, triesLeft: check.triesLeft };
      }
      verified = check.user;
      namedBy = check.user.name.trim() === '' ? invite : null;
      return { step: 'join', outcome: await accept(token) };
    },
    retryJoin(token) {
      return verified === null ? Promise.resolve('failed') : accept(token);
    },
  };
}
