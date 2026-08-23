import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { AvatarGroupProps, AvatarProps } from './Avatar.types';
import { initialsOf, initialsSize, keyedAvatars, overflowSize } from './Avatar.types';

interface WebAvatarProps extends AvatarProps {
  className?: string;
  style?: CSSProperties;
}

interface WebAvatarGroupProps extends AvatarGroupProps {
  className?: string;
  style?: CSSProperties;
}

/** The diameter and the initials size are numeric props, so they ride in as custom properties. */
function sizing(size: number, fontSize: number): CSSProperties {
  return {
    '--hg-avatar-size': `${size}px`,
    '--hg-avatar-fs': `${fontSize}px`,
  } as CSSProperties;
}

/** Perfect-circle avatar. Fallback = initials on a soft brand tint. */
export function Avatar({ src, name = '', size = 40, className, style }: WebAvatarProps) {
  const initials = initialsOf(name);
  return (
    <span
      className={classNames('hg-avatar', className)}
      style={{ ...sizing(size, initialsSize(size)), ...style }}
    >
      {src ? <img className="hg-avatar-img" src={src} alt={name} /> : initials}
    </span>
  );
}

/** Overlapping avatar group with a 2px --surface ring; the stack overlaps 30% of the diameter. */
export function AvatarGroup({
  people = [],
  size = 32,
  max = 4,
  className,
  style,
}: WebAvatarGroupProps) {
  const shown = keyedAvatars(people.slice(0, max));
  const extra = people.length - shown.length;
  const overlap: CSSProperties = { '--hg-avatar-overlap': `${-size * 0.3}px` } as CSSProperties;
  return (
    <div className={classNames('hg-avatar-group', className)} style={{ ...overlap, ...style }}>
      {shown.map(({ key, person }) => (
        <span key={key} className="hg-avatar-group-item">
          <Avatar {...person} size={size} />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="hg-avatar-overflow"
          style={sizing(size, overflowSize(size))}
        >{`+${extra}`}</span>
      ) : null}
    </div>
  );
}
