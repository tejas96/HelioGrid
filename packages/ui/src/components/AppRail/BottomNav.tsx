import type { CSSProperties, Ref } from 'react';
import { classNames } from '../../primitives/class-names';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import type { BottomNavProps, RailItem } from './AppRail.types';
import { isInView, PILL_NAV_SLOT_HEIGHT, PILL_NAV_SLOT_WIDTH, pressItem } from './AppRail.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebBottomNavProps extends BottomNavProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone shell's footer (`F7-22`): one white pill that floats, so it separates by its shadow
 * and never a line (`F7-15`).
 *
 * Slots sit space-between at a fixed width, so More stays at the right end whatever the count and
 * no slot narrows under 44 when a long label is in view.
 */
export function BottomNav({
  items,
  value,
  onChange,
  floating = true,
  safeBottom = true,
  className,
  style,
}: WebBottomNavProps) {
  const rootStyle: StyleVars = {
    '--hg-pill-slot-width': `${PILL_NAV_SLOT_WIDTH}px`,
    '--hg-pill-slot-height': `${PILL_NAV_SLOT_HEIGHT}px`,
    ...style,
  };
  return (
    <nav
      className={classNames('hg-bottom-nav', className)}
      data-floating={floating ? 'true' : undefined}
      data-safe-bottom={floating && safeBottom ? 'true' : undefined}
      style={rootStyle}
    >
      {items.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          inView={isInView(item, value)}
          onClick={() => pressItem(item, onChange)}
        />
      ))}
    </nav>
  );
}

interface NavItemProps {
  item: RailItem;
  inView: boolean;
  onClick: () => void;
}

/** In view: the near-black pill with its filled icon and its label. Otherwise the icon alone. */
function NavItem({ item, inView, onClick }: NavItemProps) {
  return (
    <button
      ref={elementRef(item.anchor)}
      type="button"
      aria-current={inView ? 'page' : undefined}
      aria-label={badgeName(item.label, item.badge)}
      onClick={onClick}
      className="hg-bottom-nav-item"
      data-in-view={inView ? 'true' : undefined}
    >
      <span className="hg-bottom-nav-icon">
        {inView ? (item.activeIcon ?? item.icon) : item.icon}
        {showsBadge(item.badge) ? (
          <span className="hg-bottom-nav-badge">
            <CountBadge count={item.badge} label={item.label.toLowerCase()} />
          </span>
        ) : null}
      </span>
      {inView ? (
        <span className="hg-bottom-nav-label" aria-hidden="true">
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

/** A coach mark reads the element this ref holds; a selector anchor needs no ref at all. */
function elementRef(anchor: CoachMarkAnchor | undefined): Ref<HTMLButtonElement> | undefined {
  if (anchor === undefined || typeof anchor === 'string' || !('current' in anchor))
    return undefined;
  return anchor as Ref<HTMLButtonElement>;
}
