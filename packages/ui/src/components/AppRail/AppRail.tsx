import { type CSSProperties, useEffect, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { showsBadge } from '../AppShell/AppShell.types';
import { CountBadge } from '../AppShell/CountBadge';
import { ShellAction } from '../AppShell/ShellAction';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { spokenItemName } from './AppRail.logic';
import type { AppRailProps, RailItem } from './AppRail.types';
import { RailAccount } from './RailAccount';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebAppRailProps extends AppRailProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The desktop sidebar, a frosted column over the page's glow: the wordmark, the bell and the fold
 * at the head, the company under it, the search, the work destinations, then the settings list and
 * the account at the foot. The item in view is a solid ink pill. Folded, the column keeps its
 * icons, each named and tipped with its label.
 */
export function AppRail(props: WebAppRailProps) {
  const { label, collapsed = false, width = 'var(--sidebar-w)', className, style } = props;
  const railStyle: StyleVars = {
    '--hg-app-rail-width': typeof width === 'number' ? `${width}px` : width,
    ...style,
  };
  return (
    <nav
      aria-label={label}
      className={classNames('hg-app-rail', className)}
      data-collapsed={collapsed ? 'true' : undefined}
      style={railStyle}
    >
      <RailHead {...props} collapsed={collapsed} />
      {props.caption === undefined || collapsed ? null : (
        <div className="hg-app-rail-caption">{props.caption}</div>
      )}
      {props.search === undefined || collapsed ? null : (
        <div className="hg-app-rail-search">{props.search}</div>
      )}
      <RailBody {...props} collapsed={collapsed} />
      <RailFoot {...props} collapsed={collapsed} />
    </nav>
  );
}

type Folded = AppRailProps & { collapsed: boolean };

/** The wordmark, the bell and the fold; folded, the fold alone. */
function RailHead({ brand, bell, fold, collapsed }: Folded) {
  return (
    <div className="hg-app-rail-head">
      {collapsed ? null : <div className="hg-app-rail-brand">{brand}</div>}
      {bell === undefined || collapsed ? null : (
        <ShellAction
          label={bell.label}
          name={bell.name}
          badge={bell.badge}
          expanded={bell.open}
          active={bell.open}
          onClick={bell.onClick}
          icon={bell.icon}
        />
      )}
      {fold === undefined ? null : (
        <span className="hg-app-rail-tip" data-tip={collapsed ? fold.expand : fold.collapse}>
          <ShellAction
            label={collapsed ? fold.expand : fold.collapse}
            expanded={!collapsed}
            onClick={fold.onToggle}
            icon={<ShellGlyph name="sidebar" size="md" />}
          />
        </span>
      )}
    </div>
  );
}

/** The work destinations; folded, the search and the bell join them. */
function RailBody({ items, value, onChange, bell, searchItem, collapsed }: Folded) {
  const row = (item: RailItem, onClick?: () => void) => (
    <RailButton
      key={item.key}
      item={item}
      active={item.key === value}
      onClick={onClick ?? (() => onChange?.(item.key))}
      tipped={collapsed}
    />
  );
  // Folded, the search and the bell leave the head and join the icons.
  const lifted = collapsed ? [searchItem, bell].filter((item) => item !== undefined) : [];
  const scroller = useMoreBelow();
  return (
    <div ref={scroller} className="hg-app-rail-scroll">
      <div className="hg-app-rail-items">
        {lifted.map((item) => row(item, item.onClick))}
        {items.map((item) => row(item))}
      </div>
    </div>
  );
}

/** The settings list and the account. */
function RailFoot({ footer = [], value, account, avatar, collapsed }: Folded) {
  return (
    <div className="hg-app-rail-foot">
      {footer.map((item) => (
        <RailButton
          key={item.key}
          item={item}
          active={item.key === value}
          onClick={item.onClick}
          tipped={collapsed}
        />
      ))}
      {account !== undefined ? (
        <RailAccount account={account} folded={collapsed} />
      ) : avatar !== undefined ? (
        <div className="hg-app-rail-avatar">{avatar}</div>
      ) : null}
    </div>
  );
}

interface RailButtonProps {
  item: RailItem;
  active: boolean;
  onClick?: () => void;
  /** Folded: the label leaves for a screen reader's ears only, and rides the button as its tip. */
  tipped: boolean;
}

function RailButton({ item, active, onClick, tipped }: RailButtonProps) {
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
      data-tip={tipped ? item.label : undefined}
    >
      <span className="hg-app-rail-icon" aria-hidden="true">
        {on && item.activeIcon !== undefined ? item.activeIcon : item.icon}
        {tipped && showsBadge(item.badge) ? <span className="hg-app-rail-dot" /> : null}
      </span>
      <span className={tipped ? 'hg-spoken-only' : 'hg-app-rail-label'}>{item.label}</span>
      <RailMarks item={item} tipped={tipped} />
    </button>
  );
}

/** What follows the label: *Soon* and the unread count — neither while folded. */
function RailMarks({ item, tipped }: { item: RailItem; tipped: boolean }) {
  if (tipped) return null;
  return (
    <>
      {item.tag === undefined ? null : (
        <span className="hg-app-rail-tag" aria-hidden="true">
          {item.tag}
        </span>
      )}
      {/* F6-17: the badge counts unread from the record. A number, not a dot — see CountBadge. */}
      {showsBadge(item.badge) ? (
        <span className="hg-app-rail-badge">
          <CountBadge count={item.badge} />
        </span>
      ) : null}
    </>
  );
}

/**
 * Marks the list while rows wait below its fold, so its foot fades under the account instead of
 * cutting a row in half; the mark goes once the last row is in view.
 */
function useMoreBelow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = ref.current;
    if (list === null || typeof ResizeObserver === 'undefined') return;
    const mark = () => {
      const below = list.scrollTop + list.clientHeight < list.scrollHeight - 1;
      list.dataset.moreBelow = below ? 'true' : 'false';
    };
    mark();
    const observer = new ResizeObserver(mark);
    observer.observe(list);
    list.addEventListener('scroll', mark, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener('scroll', mark);
    };
  }, []);
  return ref;
}
