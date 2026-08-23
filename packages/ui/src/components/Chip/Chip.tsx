import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import type { BadgeProps, ChipProps } from './Chip.types';

interface WebChipProps extends ChipProps {
  className?: string;
  /** `style` lands on the visible PILL in both forms, never on the target (Chip.d.ts). */
  style?: CSSProperties;
}

interface WebBadgeProps extends BadgeProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Fully-pill filter chip. Active = near-black fill.
 *
 * **With `onClick` it is a `<button>` with a 44×44 hit box around the 28px (24px functional)
 * pill** — the two-rectangles rule, with the extra height taken back as negative margin so no row
 * grows. **Without `onClick` it is a `<span>`**: a decorative label is not a tab stop and is not
 * announced as a button.
 */
export function Chip({
  children,
  active = false,
  onClick,
  dot = false,
  tone = 'neutral',
  density = 'expressive',
  className,
  style,
}: WebChipProps) {
  const pill = (
    <span
      className={classNames('hg-chip', className)}
      data-active={active ? 'true' : undefined}
      data-tone={tone}
      data-density={density}
      style={style}
    >
      {dot ? <span className="hg-chip-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );

  if (onClick === undefined) return pill;

  /* The target is the outer rectangle and the pill is the inner one. Pressable owns the 44px
     floor; the class only takes the extra height back as negative margin so no row grows. */
  return (
    <Pressable className={`hg-chip-target hg-chip-target--${density}`} onPress={onClick}>
      {pill}
    </Pressable>
  );
}

/** Tinted semantic badge — semantic bg + `-text` partner. Never interactive; always a span. */
export function Badge({
  children,
  tone = 'neutral',
  density = 'expressive',
  className,
  style,
}: WebBadgeProps) {
  return (
    <span
      className={classNames('hg-badge', className)}
      data-tone={tone}
      data-density={density}
      style={style}
    >
      {children}
    </span>
  );
}
