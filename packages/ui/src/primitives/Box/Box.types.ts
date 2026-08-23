import type { ReactNode } from 'react';

/**
 * One step on the DS 4px spacing scale — `--sp-<step>` on web, `theme.spacing` on native.
 * The scale is the only spacing vocabulary a primitive accepts, so arbitrary px cannot
 * enter a layout through Box or Stack.
 */
export type Space =
  | '0'
  | '0-5'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '8'
  | '10'
  | '12'
  | '16'
  | '20'
  | '24';

export interface BoxProps {
  children?: ReactNode;
  /** Padding on all sides, in spacing-scale steps. */
  padding?: Space;
  /** Horizontal padding; wins over `padding` on its axis. */
  paddingX?: Space;
  /** Vertical padding; wins over `padding` on its axis. */
  paddingY?: Space;
}

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

/** Stack is Box with flow — same spacing vocabulary, plus direction, gap and alignment. */
export interface StackProps extends BoxProps {
  direction?: StackDirection;
  /** Gap between children, in spacing-scale steps. */
  gap?: Space;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
}
