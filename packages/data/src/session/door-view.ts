import type { SignInStep } from '@heliogrid/domain';
import type { SessionSnapshot } from './types';

/** The panels the door can show; both screens render exactly one, chosen here. */
export type DoorView = 'switch' | 'done' | 'code' | 'phone';

/**
 * Which panel the door shows, in the one order both screens keep (Law 11): a pending switch
 * first — the store parks the session anonymous behind it — then a settled session's dwell,
 * then the flow's own step.
 */
export function doorView(
  session: Pick<SessionSnapshot, 'status' | 'user' | 'switch'>,
  step: SignInStep,
): DoorView {
  if (session.switch !== null) return 'switch';
  if (session.status === 'authenticated' && session.user !== null) return 'done';
  return step === 'otp' ? 'code' : 'phone';
}
