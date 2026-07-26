'use client';
import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import './Card.css';

/** _adherence allowlist: children, density, interactive, selected, style, onClick. */
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  children: ReactNode;
  density?: 'expressive' | 'functional';
  interactive?: boolean;
  selected?: boolean;
}

export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role="button" + tabIndex + Enter/Space handling are applied exactly when onClick exists; a native <button> would nest the card's interactive children invalidly
    <div
      className="ui-card"
      data-density={density}
      data-interactive={interactive || undefined}
      data-selected={selected || undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : onKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Signature circular icon container — a soft 6% tint of a semantic/brand colour.
 * Reference API: icon, color, size?, density?.
 */
export interface IconCircleProps {
  icon: ReactNode;
  /** A colour token expression, e.g. `var(--success)` — never a raw value. */
  color?: string;
  /** Explicit diameter in px; defaults to 40 expressive / 32 functional. */
  size?: number;
  density?: 'expressive' | 'functional';
  style?: CSSProperties;
}

export function IconCircle({
  icon,
  color = 'var(--accent)',
  size,
  density = 'expressive',
  style,
}: IconCircleProps) {
  const vars = {
    '--ui-icon-circle-color': color,
    ...(size !== undefined && { '--ui-icon-circle-size': `${size}px` }),
  } as CSSProperties;
  return (
    <span
      className="ui-icon-circle"
      data-density={density}
      aria-hidden
      style={{ ...vars, ...style }}
    >
      {icon}
    </span>
  );
}
