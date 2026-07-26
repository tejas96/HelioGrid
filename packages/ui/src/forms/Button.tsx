'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

/** _adherence allowlist: children, variant, size, disabled, loading, icon, iconRight, fullWidth, style, onClick. */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  children: ReactNode;
  /** `danger` does not exist — mockup bug; canonical is `destructive` (docs/10 §6). */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'lg' | 'md' | 'sm';
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className="ui-btn"
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="ui-btn-spinner" aria-hidden />
      ) : (
        <>
          {icon}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}
