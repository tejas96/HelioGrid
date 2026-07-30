'use client';
import type { CSSProperties } from 'react';
import './Avatar.css';

/** Reference size → initials font-size map (else ~0.38 × diameter). */
const AVATAR_FONT: Record<number, number> = { 24: 11, 32: 13, 40: 15, 56: 20, 80: 28 };

/** _adherence allowlist: src, name, size, style — perfect circle, initials fallback. */
export interface AvatarProps {
  src?: string;
  name: string;
  /** Diameter in px (reference steps: 24 / 32 / 40 / 56 / 80). */
  size?: number;
  style?: CSSProperties;
}

export function Avatar({ src, name, size = 40, style }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
  const vars = {
    '--ui-avatar-size': `${size}px`,
    '--ui-avatar-font': `${AVATAR_FONT[size] ?? Math.round(size * 0.38)}px`,
  } as CSSProperties;
  if (src) {
    return (
      <span className="ui-avatar" style={{ ...vars, ...style }}>
        <img className="ui-avatar-img" src={src} alt={name} />
      </span>
    );
  }
  return (
    <span
      className="ui-avatar"
      role="img"
      aria-label={name || undefined}
      style={{ ...vars, ...style }}
    >
      <span aria-hidden>{initials}</span>
    </span>
  );
}

/** Reference API: people, size, max — overlapping stack with a 2px surface ring. */
export interface AvatarGroupProps {
  // `readonly` matches the RN mirror, which held the stricter contract: a readonly array is
  // not assignable to a mutable one, so `<AvatarGroup people={PEOPLE as const} />` compiled on
  // RN and failed on web. A component has no business mutating a prop array either way.
  people?: readonly Omit<AvatarProps, 'size'>[];
  size?: number;
  max?: number;
  style?: CSSProperties;
}

export function AvatarGroup({ people = [], size = 32, max = 4, style }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const vars = {
    '--ui-avatar-group-size': `${size}px`,
    '--ui-avatar-group-overlap': `${-Math.round(size * 0.3)}px`,
    '--ui-avatar-group-extra-font': `${Math.round(size * 0.36)}px`,
  } as CSSProperties;
  return (
    <span className="ui-avatar-group" style={{ ...vars, ...style }}>
      {shown.map((person, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: people carry no stable id in the _ds API — order is the identity
        <span className="ui-avatar-group-item" key={index}>
          <Avatar {...person} size={size} />
        </span>
      ))}
      {extra > 0 && <span className="ui-avatar-group-extra">+{extra}</span>}
    </span>
  );
}
