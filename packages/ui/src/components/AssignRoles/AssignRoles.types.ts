import type { RolePreset } from '@heliogrid/domain';
import type { OverlayStatus } from '../Sheet/Sheet.types';

/**
 * **Assign Roles** (`SCR-M01-13`, `M01-20`): the twelve presets one person may hold, ticked and
 * cleared, with one live sentence above *Save roles* saying what the ticks give them. It opens in
 * `EditorSurface` — the sheet at 375, the side panel at 1536 — over the Team page. The decisions
 * are `@heliogrid/domain`'s and every word is the caller's (`@heliogrid/i18n`'s).
 */
export interface AssignRolesProps {
  open: boolean;
  onClose: () => void;
  /** The person, as the tapped row carries them; `phone` is already formatted for the market. */
  person: { readonly name: string; readonly status: OverlayStatus; readonly phone: string };
  words: AssignRolesWordsProp;
  /** The twelve presets in F2's order, each with its words and, when it cannot be cleared, why. */
  rows: readonly AssignRolesRow[];
  /** Every preset ticked now. */
  picked: readonly RolePreset[];
  /** The whole new set, once one preset is ticked or cleared. */
  onPick: (picked: readonly RolePreset[]) => void;
  /** The grant line: `grantLine(picked).speakers`, and their sentence in parts. */
  grant: AssignRolesGrant;
  /** Why *Save roles* is off — nothing changed, or nothing ticked — or null when it may run. */
  saveOffReason: string | null;
  saving: boolean;
  onSave: () => void;
}

export interface AssignRolesRow {
  readonly value: RolePreset;
  readonly title: string;
  readonly description: string;
  /** The row is held and cannot be cleared — the reason, on its own line under the description. */
  readonly lockReason: string | null;
}

export interface AssignRolesGrant {
  readonly speakers: readonly RolePreset[];
  /** The sentence; a `strong` part is a capability, set in bold. */
  readonly parts: readonly { readonly text: string; readonly strong: boolean }[];
}

export interface AssignRolesWordsProp {
  readonly overline: string;
  /** The list's heading, in the head, and the group's spoken name. */
  readonly presets: string;
  /** *Every change is recorded under your name — roles before and after.* */
  readonly recorded: string;
  /** The grant card's overline and its region's name. */
  readonly gives: string;
  readonly save: string;
  readonly close: string;
}
