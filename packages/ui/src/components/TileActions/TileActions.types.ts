import type { ReactNode } from 'react';

/**
 * A list tile's actions: small LABELLED pills at the tile's foot, below a thin `--line-tile` rule
 * — never unlabelled round icons, since a glyph alone is a guess on a roof. The pill is 36 tall
 * inside a 44px target (`Pressable` owns the floor), filled from the ground: white on the grey
 * tile. An action that is ON is the near-black pill with inverse words, and says so in its word
 * and in its pressed state. The shared contract both platform halves implement (Law 7).
 */
export interface TileActionProps {
  /** 16px glyph before the word. Hidden from the screen reader: the word names the act. */
  icon?: ReactNode;
  /** The word — always present. "Prefer", "Hide", "Archive". */
  label: string;
  /** Word shown while on — "Preferred". Falls back to `label`. */
  onLabel?: string;
  /** Pass to make it a toggle: on = near-black pill, inverse words, announced as pressed. */
  on?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export interface TileActionsProps {
  /** The `TileAction` pills. */
  children?: ReactNode;
  /** Thin `--line-tile` rule above the row. Default true. */
  rule?: boolean;
}
