import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge';
import { spokenItemName } from './AppRail.logic';
import type { AppRailProps, RailItem } from './AppRail.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebAppRailProps extends AppRailProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The desktop sidebar: the brand and the company at the top, the search, the person's
 * destinations with their names, then the utilities and the account at the foot. The item in view
 * is a solid ink pill; the sidebar sits on the page's own glow, with no edge of its own.
 */
export function AppRail({
  label,
  items,
  value,
  onChange,
  footer = [],
  avatar,
  width = 'var(--sidebar-w)',
  brand,
  caption,
  search,
  className,
  style,
}: WebAppRailProps) {
  const railStyle: StyleVars = {
    '--hg-app-rail-width': typeof width === 'number' ? `${width}px` : width,
    ...style,
  };
  return (
    <nav aria-label={label} className={classNames('hg-app-rail', className)} style={railStyle}>
      <div className="hg-app-rail-brand">
        {brand}
        {caption === undefined ? null : <div className="hg-app-rail-caption">{caption}</div>}
      </div>
      {search === undefined ? null : <div className="hg-app-rail-search">{search}</div>}
      <div className="hg-app-rail-items">
        {items.map((item) => (
          <RailButton
            key={item.key}
            item={item}
            active={item.key === value}
            onClick={() => onChange?.(item.key)}
          />
        ))}
      </div>
      <div className="hg-app-rail-spacer" />
      {footer.map((item) => (
        <RailButton key={item.key} item={item} active={false} onClick={item.onClick} />
      ))}
      {avatar !== undefined ? <div className="hg-app-rail-avatar">{avatar}</div> : null}
    </nav>
  );
}

interface RailButtonProps {
  item: RailItem;
  active: boolean;
  onClick?: () => void;
}

function RailButton({ item, active, onClick }: RailButtonProps) {
  const on = active || item.open === true;
  return (
    <button
      type="button"
      aria-label={item.name === undefined ? undefined : spokenItemName(item)}
      aria-current={active ? 'page' : undefined}
      aria-expanded={item.open}
      onClick={onClick}
      className="hg-app-rail-button"
      data-active={on ? 'true' : undefined}
    >
      <span className="hg-app-rail-icon" aria-hidden="true">
        {on && item.activeIcon !== undefined ? item.activeIcon : item.icon}
      </span>
      <span className="hg-app-rail-label">{item.label}</span>
      {/* F6-17: the badge counts unread from the record. A number, not a dot — see CountBadge. */}
      {showsBadge(item.badge) ? (
        <span className="hg-app-rail-badge">
          <CountBadge count={item.badge} />
        </span>
      ) : null}
    </button>
  );
}
