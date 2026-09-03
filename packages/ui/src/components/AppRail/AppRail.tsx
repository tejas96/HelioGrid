import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge';
import type { AppRailProps, RailItem } from './AppRail.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebAppRailProps extends AppRailProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The 72px desktop icon rail: the product mark at the top, primary destinations, then utilities
 * and the account avatar pinned to the bottom. The active item is an accent-subtle rounded tile
 * — never a border, never a left accent bar.
 *
 * THE WIDTH DEFAULTS FROM THE TOKEN, the way `AppHeader` reads `--header-h`. `--rail-w` was
 * renamed from a 260px sidebar and then read by nothing, which is the same defect the rename was
 * about; a raw number still overrides it for a caller that needs one.
 */
export function AppRail({
  items,
  value,
  onChange,
  footer = [],
  avatar,
  width = 'var(--rail-w, 72px)',
  brand,
  className,
  style,
}: WebAppRailProps) {
  const railStyle: StyleVars = {
    '--hg-app-rail-width': typeof width === 'number' ? `${width}px` : width,
    ...style,
  };
  return (
    <nav aria-label="Primary" className={classNames('hg-app-rail', className)} style={railStyle}>
      <div className="hg-app-rail-brand">{brand}</div>
      {items.map((item) => (
        <RailButton
          key={item.key}
          item={item}
          active={item.key === value}
          onClick={() => onChange?.(item.key)}
        />
      ))}
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
  return (
    <button
      type="button"
      aria-label={badgeName(item.label, item.badge)}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className="hg-app-rail-button"
      data-active={active ? 'true' : undefined}
    >
      {item.icon}
      {/* F6-17: the badge counts unread from the record. A number, not a dot — see CountBadge. */}
      {showsBadge(item.badge) ? (
        <span className="hg-app-rail-badge">
          <CountBadge count={item.badge} label={item.label.toLowerCase()} />
        </span>
      ) : null}
    </button>
  );
}
