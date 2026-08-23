import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { badgeName, showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge';
import type { BottomNavProps, RailItem } from './AppRail.types';
import { ICON_BOX, ICON_GAP, ICON_TOP, isFabSlot, LABEL_TOP, slotDrop } from './AppRail.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebBottomNavProps extends BottomNavProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone counterpart: four destinations around a raised near-black FAB, under ONE parabolic
 * top edge that the icons and labels ride.
 *
 * TWO THINGS MAKE THE EDGE READ CORRECTLY. The curve is a quadratic Bezier, not
 * `border-radius: 50% / Hpx` — an elliptical radius is near-vertical at the corners and flat
 * through the middle, which is a flat bar with bumped ends. And THE CONTENT RIDES THE CURVE:
 * each slot's icon and label are pushed down by the arc's depth at that slot's centre, so the
 * labels sit on a shallow smile at a constant distance below the edge above them.
 *
 * The slots are equal 1fr widths, the FAB's included — a fixed-width spacer for the FAB threw
 * the others off centre.
 */
export function BottomNav({
  items,
  value,
  onChange,
  fab,
  shape = 'curve',
  curveHeight = 21,
  height = 72,
  notchRadius = 38,
  fabOffset = 23,
  className,
  style,
}: WebBottomNavProps) {
  const count = items.length === 0 ? 1 : items.length;
  const curved = shape === 'curve';
  const rise = curved ? curveHeight : 0;
  const rootStyle: StyleVars = {
    '--hg-bottom-nav-height': `${height}px`,
    '--hg-bottom-nav-slots': count,
    '--hg-bottom-nav-notch-radius': `${notchRadius}px`,
    '--hg-bottom-nav-fab-offset': `${fabOffset}px`,
    '--hg-bottom-nav-icon-top': `${ICON_TOP}px`,
    '--hg-bottom-nav-icon-box': `${ICON_BOX}px`,
    '--hg-bottom-nav-icon-gap': `${ICON_GAP}px`,
    '--hg-bottom-nav-label-top': `${LABEL_TOP}px`,
    ...style,
  };

  return (
    <div className={classNames('hg-bottom-nav', className)} style={rootStyle}>
      <div className="hg-bottom-nav-bar">
        {curved ? (
          /* Horizontal units stretch to the bar's width (preserveAspectRatio none): an affine
             stretch of a parabola is still a parabola, and the vertical stays 1:1 because the
             viewBox height is the pixel height — so 21px means 21px at any width. */
          <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="hg-bottom-nav-plate"
          >
            <path
              d={`M0 ${rise}Q50 ${-rise} 100 ${rise}L100 ${height}L0 ${height}Z`}
              fill="var(--surface)"
            />
          </svg>
        ) : (
          <div aria-hidden="true" className="hg-bottom-nav-plate" data-shape={shape} />
        )}
        <nav aria-label="Primary" className="hg-bottom-nav-slots">
          {items.map((item, index) => {
            const drop: StyleVars = {
              '--hg-bottom-nav-drop': `${slotDrop(index, count, rise)}px`,
            };
            if (isFabSlot(item)) {
              return (
                <span key={item.key} className="hg-bottom-nav-fab-slot" style={drop}>
                  {item.label !== undefined ? (
                    <span className="hg-bottom-nav-label">{item.label}</span>
                  ) : null}
                </span>
              );
            }
            return (
              <NavItem
                key={item.key}
                item={item}
                active={item.key === value}
                dropStyle={drop}
                onClick={() => onChange?.(item.key)}
              />
            );
          })}
        </nav>
      </div>
      {fab !== undefined ? <div className="hg-bottom-nav-fab">{fab}</div> : null}
    </div>
  );
}

interface NavItemProps {
  item: RailItem;
  active: boolean;
  dropStyle: CSSProperties;
  onClick: () => void;
}

/**
 * The label is EXPLICIT. Without it the accessible name is computed from the contents — the
 * badge numeral, the badge's own sr-only words and the visible label all ran together as
 * "7 7 unread leads Leads". One aria-label, same wording as the rail and the shell button.
 */
function NavItem({ item, active, dropStyle, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={badgeName(item.label, item.badge)}
      onClick={onClick}
      className="hg-bottom-nav-item"
      data-active={active ? 'true' : undefined}
      style={dropStyle}
    >
      {/* Filled variants exist only for the active item — the one place this system mixes them.
          Colour carries the state; the label weight does not change. */}
      <span className="hg-bottom-nav-icon">
        {active ? (item.activeIcon ?? item.icon) : item.icon}
        {showsBadge(item.badge) ? (
          <span className="hg-bottom-nav-badge">
            <CountBadge count={item.badge} label={item.label.toLowerCase()} />
          </span>
        ) : null}
      </span>
      <span className="hg-bottom-nav-label">{item.label}</span>
    </button>
  );
}
