import type { CSSProperties } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { clampCount } from '../../utils/count';
import { renderActionReason } from '../ActionReason';
import { renderMarks } from '../ChipGroup';
import { hasReason, normalise, TAB_COUNT_MAX } from './Tabs.options';
import type { TabsProps } from './Tabs.types';

type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

interface WebTabsProps extends TabsProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Underline tabs — a 2px accent indicator slides between tabs, no border rule.
 *
 * THE STRIP IS A `tablist` AND EACH TAB CARRIES `aria-selected`. Which one is current was a 2px
 * rule, a weight and a colour and nothing else — F7-12, status by appearance alone. Every tab is
 * its own tab stop: the strip selects on activation, not on focus, so there is no roving index.
 *
 * A DISABLED TAB STAYS READABLE AND STAYS REACHABLE. Hiding it would rename the tab set, so
 * the label is information: `--text-tertiary`, never `--text-disabled`. With a
 * `disabledReason` the tab is `aria-disabled` and STILL FOCUSABLE (activation suppressed
 * here), the sentence rendered under the strip and tied to it by `aria-describedby` — a
 * natively disabled button leaves the tab order, so the sentence would exist for everyone
 * except the keyboard user who most needs it. Without a reason the native attribute stays.
 */
export function Tabs({ tabs, value, onChange, className, style }: WebTabsProps) {
  const items = useMemo(() => normalise(tabs), [tabs]);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const autoId = useId();
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const active = items.find((item) => item.value === value);
    const element = active === undefined ? null : (refs.current[active.value] ?? null);
    if (element === null) {
      return;
    }
    const left = element.offsetLeft;
    const width = element.offsetWidth;
    setIndicator((previous) =>
      previous.left === left && previous.width === width ? previous : { left, width },
    );
  }, [items, value]);

  const reasoned = items.filter((tab) => tab.disabled === true && hasReason(tab));
  const wrapped = reasoned.length > 0;
  const stripStyle: StyleVars = {
    '--hg-tabs-indicator-left': `${indicator.left}px`,
    '--hg-tabs-indicator-width': `${indicator.width}px`,
    ...(wrapped ? undefined : style),
  };

  const strip = (
    /* A STRIP OF TABS IS A TABLIST. Without it the current tab is a 2px indicator and a weight —
       status by appearance alone (F7-12) — and the same two roles the rest of the system already
       spells (FilterChips, LanguageSwitcher) were the ones missing here. */
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={classNames('hg-tabs-strip', wrapped ? undefined : className)}
      style={stripStyle}
    >
      {items.map((tab) => {
        const active = tab.value === value;
        const off = tab.disabled === true;
        const reasonId = off && hasReason(tab) ? `${autoId}-r-${tab.value}` : undefined;
        return (
          <button
            key={tab.value}
            type="button"
            ref={(element) => {
              refs.current[tab.value] = element;
            }}
            role="tab"
            /* WHICH TAB IS CURRENT, said rather than drawn. `data-active` is the indicator's
               hook and carries nothing to a screen reader. */
            aria-selected={active}
            className="hg-tabs-tab"
            data-active={active ? 'true' : undefined}
            data-off={off ? 'true' : undefined}
            disabled={off && !hasReason(tab)}
            aria-disabled={off ? true : undefined}
            aria-describedby={reasonId}
            onClick={() => {
              if (!off) {
                onChange?.(tab.value);
              }
            }}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="hg-tabs-count">{clampCount(tab.count, TAB_COUNT_MAX)}</span>
            ) : null}
            {renderMarks(tab.marks)}
          </button>
        );
      })}
      {/* The sliding rule is the sighted half of `aria-selected`, and nothing else — a tablist's
          children are its tabs, so it is hidden rather than announced as an empty one. */}
      <span className="hg-tabs-indicator" aria-hidden="true" />
    </div>
  );

  if (!wrapped) {
    return strip;
  }
  return (
    <div className={classNames('hg-tabs', className)} style={style}>
      {strip}
      <div className="hg-tabs-reasons">
        {reasoned.map((tab) => (
          <span key={tab.value}>
            {renderActionReason(tab.disabledReason, { id: `${autoId}-r-${tab.value}` })}
          </span>
        ))}
      </div>
    </div>
  );
}
