import type { SessionLoss } from '@heliogrid/domain';

const UNAUTHENTICATED = 401;

/**
 * A sign-in another app lends a page: the phone shows a web page in its web view and hands it the
 * phone's own short-lived API token, never its session (`T-M05-002a`). `current` waits for the
 * first token; `renew` asks the lender for a fresh one after a 401, and is `null` when it has none.
 */
export interface BorrowedToken {
  current(): Promise<string | null>;
  renew(): Promise<string | null>;
}

/**
 * A borrowed token holds no session to refresh: a 401 asks the lender once for a fresh token and
 * sends again. A lender with none — its own person signed out — ends the page's session.
 */
export async function renewedBorrowed<Answer extends { readonly status: number }>(
  config: {
    readonly token: BorrowedToken;
    /** The transport's session signals, the two a renewal reads (`SessionSignals`). */
    readonly session: {
      couldHoldSession(): boolean;
      onSessionLost(loss: SessionLoss): void;
    };
  },
  first: Answer,
  resend: () => Promise<Answer>,
  lossOf: (refused: Answer) => SessionLoss,
): Promise<Answer> {
  if (!config.session.couldHoldSession()) return first;
  if ((await config.token.renew()) === null) {
    config.session.onSessionLost('signed-out');
    return first;
  }
  const again = await resend();
  if (again.status === UNAUTHENTICATED) config.session.onSessionLost(lossOf(again));
  return again;
}
