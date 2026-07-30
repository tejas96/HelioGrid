'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './IconButton.css';

/** _adherence allowlist: children, size, label, variant, disabled, style, onClick. */
export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'aria-label'> {
  children: ReactNode;
  /** Accessible name — icon-only controls require it (docs/10 §11, N1–N10). */
  label: string;
  /** Reference takes free px (default 40); enum keeps sizing on the checked scale. */
  size?: 32 | 40 | 48;
  variant?: 'surface' | 'dark' | 'ghost';
}

export function IconButton({
  children,
  label,
  size = 40,
  variant = 'surface',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className="ui-iconbtn"
      aria-label={label}
      data-size={size}
      data-variant={variant}
      {...rest}
    >
      {children}
    </button>
  );
}
