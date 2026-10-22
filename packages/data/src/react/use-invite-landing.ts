'use client';
import {
  COUNTDOWN_TICK_MS,
  INITIAL_INVITE_LANDING,
  type InviteAskOutcome,
  type InviteJoinResult,
  type InviteLandingFrame,
  type InviteLandingPress,
  type InviteLandingState,
  type InviteRead,
  inviteLandingFrame,
  inviteLandingReducer,
} from '@heliogrid/domain';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { answerOf, isUnanswered } from '../errors/errors';
import type { InvitationRepository } from '../invitation/repository';
import { useDataLayer } from './context';

/** The invite landing as both screens consume it (Law 11): the facts, the frame, and the presses. */
export interface InviteLanding {
  readonly state: InviteLandingState;
  readonly frame: InviteLandingFrame;
  typeCode(code: string): void;
  press(control: InviteLandingPress): void;
}

/** A link with no invite behind it, or one the api could not read as a token, is the same dead link. */
const GONE_CODES: ReadonlySet<string> = new Set(['NOT_FOUND', 'VALIDATION_FAILED']);

async function readOf(
  invitation: InvitationRepository,
  token: string,
  signal: AbortSignal,
): Promise<InviteRead> {
  try {
    const invite = await invitation.landing(token, signal);
    return { kind: invite.status, invite };
  } catch (error) {
    const answer = answerOf(error);
    if (isUnanswered(error) || answer === null) return { kind: 'unread' };
    return GONE_CODES.has(answer.code) ? { kind: 'gone' } : { kind: 'unread' };
  }
}

/** Why an ask did not reach the inviter: withdrawn meanwhile, no answer, or refused. */
function askOutcomeOf(error: unknown): InviteAskOutcome {
  if (isUnanswered(error)) return 'unreached';
  return answerOf(error)?.code === 'NOT_FOUND' ? 'gone' : 'failed';
}

/**
 * `SCR-M01-08`'s flow for the link's `token`. The reducer decides; this hook only does what it asked
 * for — the read, the code sent on arrival through the session store (so the challenge is the
 * store's, as the door's is), the join, the retry and the ask — and the once-a-second clock while
 * the resend gap runs. The join admits the session last: the app's navigator then moves the person
 * on by `landingFor`, as after any sign-in.
 */
export function useInviteLanding(token: string, onJoined?: () => void): InviteLanding {
  const { session, repositories } = useDataLayer();
  const { invitation } = repositories;
  const [state, dispatch] = useReducer(inviteLandingReducer, INITIAL_INVITE_LANDING);
  // Called from the join's own answer, not a render: the admitted session can take the screen out
  // of focus, and a navigator may pause an unfocused screen's renders before its effects see the join.
  const joined = useRef(onJoined);
  joined.current = onJoined;
  const answerJoin = useCallback((result: InviteJoinResult) => {
    dispatch({ type: 'join-ended', result });
    if (result.step === 'join' && result.outcome === 'joined') joined.current?.();
  }, []);
  const { pending, code } = state;
  const codeCall = code.pending;
  const { cooldownLeft } = code;

  useEffect(() => {
    if (pending === null) return;
    const aborts = new AbortController();
    switch (pending.kind) {
      case 'read':
        void readOf(invitation, token, aborts.signal).then((read) => {
          if (!aborts.signal.aborted) dispatch({ type: 'read-ended', read });
        });
        return () => aborts.abort();
      case 'retry-join':
        void session.retryJoin(token).then((outcome) => answerJoin({ step: 'join', outcome }));
        return;
      case 'ask':
        void invitation.requestReinvite(token).then(
          () => dispatch({ type: 'ask-ended', outcome: 'asked' }),
          (error: unknown) => dispatch({ type: 'ask-ended', outcome: askOutcomeOf(error) }),
        );
        return;
    }
  }, [pending, invitation, session, token, answerJoin]);

  useEffect(() => {
    if (codeCall === null) return;
    switch (codeCall.kind) {
      case 'request':
        void session
          .requestOtp(codeCall.phone, codeCall.channel)
          .then((outcome) => dispatch({ type: 'request-ended', outcome, now: Date.now() }));
        return;
      case 'verify':
        void session.joinWithInvite(token, codeCall.code).then(answerJoin);
        return;
      // The landing offers no Google sign-in: the invite is keyed to the number.
      default:
        return;
    }
  }, [codeCall, session, token, answerJoin]);

  useEffect(() => {
    if (cooldownLeft === 0) return;
    const tick = setTimeout(() => dispatch({ type: 'tick', now: Date.now() }), COUNTDOWN_TICK_MS);
    return () => clearTimeout(tick);
  }, [cooldownLeft]);

  return useMemo(
    () => ({
      state,
      frame: inviteLandingFrame(state),
      typeCode: (next: string) => dispatch({ type: 'code-typed', code: next }),
      press: (control: InviteLandingPress) => {
        if (control === 'verify' || control === 'resend') dispatch({ type: control });
        else if (control === 'try-again' || control === 'ask') dispatch({ type: control });
      },
    }),
    [state],
  );
}
