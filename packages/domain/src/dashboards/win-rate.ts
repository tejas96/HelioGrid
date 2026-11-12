/**
 * Win rate on CLOSED deals only (`M13-27`): won ÷ (won + lost). Below the floor the number would be
 * a story, not a rate, so the tile says there are too few yet and shows the counts (`M13-18`'s
 * small-sample honesty). A rate is basis points, rounded half up — never money.
 */
export const WIN_RATE_MIN_CLOSED = 5;

export type WinRate =
  | {
      readonly kind: 'rate';
      readonly won: number;
      readonly lost: number;
      readonly basisPoints: number;
    }
  | { readonly kind: 'too_few'; readonly won: number; readonly lost: number };

export function winRateOf(won: number, lost: number): WinRate {
  const closed = won + lost;
  if (closed < WIN_RATE_MIN_CLOSED) return { kind: 'too_few', won, lost };
  return { kind: 'rate', won, lost, basisPoints: Math.round((won * 10_000) / closed) };
}

/** The look-back the rate reads (`M13-23`): the last 90 days on the tenant's clock. */
export const WIN_RATE_WINDOW_DAYS = 90;
