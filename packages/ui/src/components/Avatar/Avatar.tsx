import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { avatarIris } from './Avatar.logic';
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

/**
 * Perfect-circle avatar. Fallback = initials on a brand iris tint (`hue`, from the name by
 * default). With `mark`, the person's standing sits at the disc's foot, hidden from the screen
 * reader: the words beside it already say it. Without one the disc is the whole element.
 */
export function Avatar({ mark, className, style, ...disc }: WebAvatarProps) {
  if (mark === undefined) return <AvatarDisc {...disc} className={className} style={style} />;
  return (
    <span className={classNames('hg-avatar-marked', className)} style={style}>
      <AvatarDisc {...disc} />
      <span className="hg-avatar-mark" data-mark={mark} aria-hidden="true">
        <span className="hg-avatar-mark-dot" />
      </span>
    </span>
  );
}

function AvatarDisc({
  src,
  name = '',
  size = 40,
  hue = 'auto',
  glyph,
  className,
  style,
}: Omit<WebAvatarProps, 'mark'>) {
  const shape = { ...sizing(size, initialsSize(size)), ...style };
  /* A thing has no name to fall back to and no tint: its glyph on a white disc. */
  if (glyph !== undefined && glyph !== null) {
    return (
      <span className={classNames('hg-avatar', 'hg-avatar--glyph', className)} style={shape}>
        {glyph}
      </span>
    );
  }
  const iris = avatarIris(hue, name);
  return (
    <span
      className={classNames('hg-avatar', iris === null ? undefined : 'hg-iris', className)}
      data-iris={iris ?? undefined}
      style={shape}
    >
      {src ? <img className="hg-avatar-img" src={src} alt={name} /> : initialsOf(name)}
    </span>
  );
}

/** Overlapping avatar group with a 2px ring in the ground (or `ring`); the stack overlaps 30%. */
export function AvatarGroup({
  people = [],
  size = 32,
  max = 4,
  ring,
  className,
  style,
}: WebAvatarGroupProps) {
  const shown = keyedAvatars(people.slice(0, max));
  const extra = people.length - shown.length;
  const vars = {
    '--hg-avatar-overlap': `${-size * 0.3}px`,
    ...(ring === undefined ? {} : { '--hg-avatar-ring': ring }),
  } as CSSProperties;
  return (
    <div className={classNames('hg-avatar-group', className)} style={{ ...vars, ...style }}>
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
