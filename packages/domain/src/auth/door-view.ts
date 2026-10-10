import type { LoginState, SignInStep } from './login-state';
import type { EndedAccess, SessionSnapshot, SignInDoor } from './session';

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
export type DoorNotice = 'not-reached' | 'access-removed';

/**
 * The number step's block (`SCR-M01-01`): a first send that got no answer says so (`m-not-reached`);
 * otherwise, on the front door, a removal the session ended on says that (`m-access-removed`,
 * `S1.wrong.4`) until the next sign-in clears it — unless a Google sign-in that did not finish is
 * saying its own block there. The signup door draws no removal. On the code step the frame speaks.
 */
export function doorNotice(
  state: Pick<LoginState, 'step' | 'request' | 'googleEnded'>,
  ended: EndedAccess | null,
  door: SignInDoor,
): DoorNotice | null {
  if (state.step !== 'phone') return null;
  if (state.request === 'unreached') return 'not-reached';
  const removalSaid = door === 'sign-in' && ended !== null && state.googleEnded !== 'failed';
  return removalSaid ? 'access-removed' : null;
}
