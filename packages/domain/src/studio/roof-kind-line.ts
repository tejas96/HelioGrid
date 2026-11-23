import type { MeetChoice } from './roof-meeting';
import type { RoofName } from './roof-names';
import type { RoofBecame, RoofStepState } from './roof-step-state';

/**
 * The line after a new roof closes (`T-M05-002`, part e): what it became, and its likely kinds as
 * chips with the one it is now first, so a wrong guess is one tap. It stays while the roof step
 * still says it, through each chip tapped, and leaves at the next act.
 */
export interface KindLine {
  /** The roof a chip changes: the new roof, or the roof it is joined with now. */
  readonly roof: number;
  readonly became: RoofBecame;
  /** The roof Join made it one with; `null` while it stands by itself. */
  readonly joined: RoofName | null;
  /** The chips in the order shown: the lit one first. */
  readonly chips: readonly { readonly choice: MeetChoice; readonly lit: boolean }[];
}

function lineOf(roof: number, became: RoofBecame, joined: RoofName | null): KindLine {
  const lit: MeetChoice = joined === null ? became.is : 'join';
  const rest = became.choices.filter((choice) => choice !== lit);
  const chips = [lit, ...rest].map((choice) => ({ choice, lit: choice === lit }));
  return { roof, became, joined, chips };
}

export function kindLineOf(state: RoofStepState): KindLine | null {
  const said = state.kind === 'idle' ? state.said : null;
  if (said?.kind === 'joined') {
    return said.apart === undefined ? null : lineOf(said.roof, said.apart.became, said.name);
  }
  if (said?.kind !== 'closed' && said?.kind !== 'cut') return null;
  return said.became === undefined ? null : lineOf(said.became.roof, said.became, null);
}
