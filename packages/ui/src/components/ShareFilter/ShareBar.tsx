import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { useFormat } from '../MarketProvider';
import { drawnSegments, isThinSegment, totalOf } from './ShareFilter.logic';
import type { ShareFilterProps } from './ShareFilter.types';

interface ShareBarProps
  extends Pick<ShareFilterProps, 'label' | 'barLabel' | 'items' | 'pressed' | 'onPress'> {
  className?: string;
  style?: CSSProperties;
}

/**
 * `layout="bar"`: one stacked bar — each segment as wide as its part's count — over a row of count
 * buttons, each a toggle that scopes the list to its part. The bar is one image named by
 * `barLabel`; without that sentence it is hidden, since the buttons say every count.
 */
export function ShareBar({
  label,
  barLabel,
  items,
  pressed,
  onPress,
  className,
  style,
}: ShareBarProps) {
  const { number } = useFormat();
  const total = totalOf(items);
  return (
    <fieldset
      className={classNames('hg-share-filter', className)}
      data-layout="bar"
      aria-label={label}
      style={style}
    >
      <div
        className="hg-share-filter-bar"
        {...(barLabel === undefined
          ? { 'aria-hidden': true }
          : { role: 'img', 'aria-label': barLabel })}
      >
        {drawnSegments(items).map((item) => (
          <span
            key={item.id}
            className={`hg-share-filter-segment hg-share-hue-${item.hue}`}
            data-thin={isThinSegment(item.count, total)}
            style={{ flex: item.count }}
          />
        ))}
      </div>
      <div className="hg-share-filter-counts">
        {items.map((item) => (
          <Pressable
            key={item.id}
            className={`hg-share-filter-count hg-share-hue-${item.hue}`}
            accessibilityLabel={item.accessibleLabel}
            accessibilityState={{ selected: pressed === item.id }}
            onPress={() => onPress(item.id)}
          >
            <span className="hg-share-filter-dot" />
            <span className="hg-share-filter-count-label">{item.label}</span>
            <span className="hg-share-filter-count-figure">{number(item.count)}</span>
            <span className="hg-share-filter-chevron">
              <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
            </span>
          </Pressable>
        ))}
      </div>
    </fieldset>
  );
}
