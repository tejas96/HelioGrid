import type { LoginState, SignInStep } from './login-state';
import type { SessionSnapshot } from './session';

/** The panels the door can show; both screens render exactly one, chosen here. */
export type DoorView = 'switch' | 'done' | 'code' | 'google-link' | 'phone';

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
  if (step === 'otp') return 'code';
  return step;
}

/** The one block the number step carries above the field; `null` when it carries none. */
export type DoorNotice = 'not-reached';

/**
 * A first send that got no answer stays on the number and says so above it (`SCR-M01-01`
 * `m-not-reached`); on the code step the frame itself says it.
 */
export function doorNotice(state: Pick<LoginState, 'step' | 'request'>): DoorNotice | null {
  return state.step === 'phone' && state.request === 'unreached' ? 'not-reached' : null;
}
