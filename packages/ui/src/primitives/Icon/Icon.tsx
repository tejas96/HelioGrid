import { classNames } from '../class-names';
import type { IconProps } from './Icon.types';

interface WebIconProps extends IconProps {
  className?: string;
}

/** Sizing ladder + currentColor + a11y. Decorative (no label) icons are aria-hidden. */
export function Icon({ children, size = 'md', label, className }: WebIconProps) {
  if (label !== undefined) {
    return (
      <span
        className={classNames('hg-icon', className)}
        data-size={size}
        role="img"
        aria-label={label}
      >
        {children}
      </span>
    );
  }
  return (
    <span className={classNames('hg-icon', className)} data-size={size} aria-hidden="true">
      {children}
    </span>
  );
}
