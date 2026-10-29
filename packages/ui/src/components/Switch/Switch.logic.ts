import type { SwitchProps } from './Switch.types';

/**
 * The switch is the reason a send refused: an error line is drawn under it and its track rings.
 * `null` and `false` are React's "nothing", so they draw no line.
 */
export function hasErrorLine(error: SwitchProps['error']): boolean {
  return error !== undefined && error !== null && error !== false;
}
