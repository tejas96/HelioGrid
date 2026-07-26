'use client';
import type { CSSProperties, KeyboardEvent, MouseEventHandler, ReactNode } from 'react';
import { IconCircle } from './Card';
import './ListRow.css';

/** _adherence allowlist: icon, iconColor, avatar, title, subtitle, trailing, density, onClick, style. */
export interface ListRowProps {
  icon?: ReactNode;
  /** A colour token expression for the leading IconCircle, e.g. `var(--success)`. */
  iconColor?: string;
  /** Leading avatar node — wins over `icon` when both are given (reference behaviour). */
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  density?: 'expressive' | 'functional';
  onClick?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
}

export function ListRow({
  icon,
  iconColor = 'var(--accent)',
  avatar,
  title,
  subtitle,
  trailing,
  density = 'expressive',
  onClick,
  style,
}: ListRowProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role="button" + tabIndex + Enter/Space handling are applied exactly when onClick exists; the row hosts interactive trailing actions a native <button> could not nest
    <div
      className="ui-list-row"
      data-density={density}
      data-interactive={onClick ? true : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      style={style}
    >
      {avatar ?? (icon ? <IconCircle icon={icon} color={iconColor} density={density} /> : null)}
      <div className="ui-list-row-text">
        <div className="ui-list-row-title">{title}</div>
        {subtitle != null && <div className="ui-list-row-subtitle">{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}
