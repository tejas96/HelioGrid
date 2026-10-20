import type { TeamActAnswer } from './team-acts';

/**
 * What an answer to an invite send means (`M01-12`, `SCR-M01-07`), read once for both apps and
 * both lives of the screen (Law 11). A refusal the screen draws is told apart by its code, never
 * its status alone: 422 is both a number no market covers and a reused creation key.
 *
 * `sent` it landed · `failed` nothing usable came back, so the form keeps its values and says so.
 */
export type InviteOutcome = 'sent' | 'failed';

export function inviteOutcome(answer: TeamActAnswer): InviteOutcome {
  if (answer === null) return 'failed';
  return answer.status >= 200 && answer.status < 300 ? 'sent' : 'failed';
}
