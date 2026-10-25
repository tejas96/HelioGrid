import type { CSSProperties } from 'react';
import { ShareBar } from './ShareBar';
import type { ShareFilterProps } from './ShareFilter.types';
import { ShareRings } from './ShareRings';
import './ShareFilter.css';

/**
 * How a whole splits, and the filter onto each part: `rings` (the phone's overview) or `bar` (the
 * panel's). Every ring or count button is a toggle — `aria-pressed` on the one in force — and every
 * word is the caller's.
 */
interface WebShareFilterProps extends ShareFilterProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * How a whole splits, and the filter onto each part: `rings` (the phone's overview) or `bar` (the
 * panel's). Every ring or count button is a toggle — `aria-pressed` on the one in force — and every
 * word is the caller's.
 */

export function ShareFilter({ layout, barLabel, ...filter }: WebShareFilterProps) {
  return layout === 'rings' ? (
    <ShareRings {...filter} />
  ) : (
    <ShareBar barLabel={barLabel} {...filter} />
  );
}
