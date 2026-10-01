import type { CSSProperties, Ref } from 'react';
import { classNames } from '../../primitives/class-names';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';
import type { BottomNavItem, RailItem } from './AppRail.types';
import {
  isFabSlot,
  PILL_NAV_HEIGHT,
  PILL_NAV_SLOT_HEIGHT,
  PILL_NAV_SLOT_WIDTH,
} from './AppRail.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface PillNavProps {
  items: BottomNavItem[];
  value?: string;
  onChange?: (key: string) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone shell's footer (`F7-22`): one white pill that floats, so it separates by its shadow
 * and never a line (`F7-15`). Where it floats — the device's insets — is the screen's to place.
 *
 * A fab slot has no picture of its own, so the pill draws none: the add action is a plain item
 * the caller never makes `value`. Slots sit space-between at a fixed width, so More stays at the
 * right end whatever the count and no slot narrows under 44 when a long label is in view.
 */
export function PillNav({ items, value, onChange, className, style }: PillNavProps) {
  const rootStyle: StyleVars = {
    '--hg-pill-height': `${PILL_NAV_HEIGHT}px`,
    '--hg-pill-slot-width': `${PILL_NAV_SLOT_WIDTH}px`,
    '--hg-pill-slot-height': `${PILL_NAV_SLOT_HEIGHT}px`,
    ...style,
  };
  return (
    <nav className={classNames('hg-pill-nav', className)} style={rootStyle}>
      {items.map((item) =>
        isFabSlot(item) ? null : (
          <PillItem
            key={item.key}
            item={item}
            inView={item.key === value}
            onClick={() => (item.onClick === undefined ? onChange?.(item.key) : item.onClick())}
          />
        ),
      )}
    </nav>
  );
}

interface PillItemProps {
  item: RailItem;
  inView: boolean;
  onClick: () => void;
}

/** In view: the near-black pill with its filled icon and its label. Otherwise the icon alone. */
function PillItem({ item, inView, onClick }: PillItemProps) {
  return (
    <button
      ref={elementRef(item.anchor)}
      type="button"
      aria-current={inView ? 'page' : undefined}
      aria-label={badgeName(item.label, item.badge)}
      onClick={onClick}
      className="hg-pill-nav-item"
      data-in-view={inView ? 'true' : undefined}
    >
      <span className="hg-pill-nav-icon">
        {inView ? (item.activeIcon ?? item.icon) : item.icon}
        {showsBadge(item.badge) ? (
          <span className="hg-pill-nav-badge">
            <CountBadge count={item.badge} label={item.label.toLowerCase()} />
          </span>
        ) : null}
      </span>
      {inView ? (
        <span className="hg-pill-nav-label" aria-hidden="true">
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
