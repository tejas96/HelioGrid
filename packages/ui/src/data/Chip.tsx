'use client';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import './Chip.css';

export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

/** _adherence allowlist: children, active, onClick, dot, tone, density, style. */
export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  children: ReactNode;
  active?: boolean;
  /** 6px status dot, coloured by `tone` (white on the active fill). */
  dot?: boolean;
  tone?: ChipTone;
  density?: 'expressive' | 'functional';
}

export function Chip({
  children,
  active = false,
  dot = false,
  tone = 'neutral',
  density = 'expressive',
  type = 'button',
  onClick,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      className="ui-chip"
      data-active={active || undefined}
      data-tone={tone}
      data-density={density}
      data-interactive={onClick ? true : undefined}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
      {...rest}
    >
      {dot && <span className="ui-chip-dot" aria-hidden />}
      {children}
    </button>
  );
}

/** Reference API: children, tone, density, style — tinted semantic badge (bg + toned text). */
export interface BadgeProps {
  children: ReactNode;
  tone?: ChipTone;
  density?: 'expressive' | 'functional';
  style?: CSSProperties;
}

export function Badge({ children, tone = 'neutral', density = 'expressive', style }: BadgeProps) {
  return (
    <span className="ui-badge" data-tone={tone} data-density={density} style={style}>
      {children}
    </span>
  );
}
