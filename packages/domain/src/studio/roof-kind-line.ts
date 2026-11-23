import type { StudioDocument } from './document';
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

/**
 * The line as it stands over the design now. The design can change under it from outside the roof
 * step — a height kept in 3D, a save read again — and then it speaks of a roof that is no longer
 * the one at its place: it is gone, never shown over another roof.
 */
export function kindLineOf(state: RoofStepState, document: StudioDocument | null): KindLine | null {
  const said = state.kind === 'idle' ? state.said : null;
  if (document === null) return null;
  if (said?.kind === 'joined') {
    const apart = said.apart;
    if (apart === undefined || document.roofs[said.roof] !== apart.joined) return null;
    return lineOf(said.roof, apart.became, said.name);
  }
  if (said?.kind !== 'closed' && said?.kind !== 'cut') return null;
  const became = said.became;
  if (became === undefined || document.roofs[became.roof]?.id !== became.id) return null;
  return lineOf(became.roof, became, null);
}
