import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { useFormat } from '../MarketProvider';
import { ProgressRing } from '../ProgressRing';
import { HUE_INK } from './ShareFilter.inks';
import { arcShare, totalOf } from './ShareFilter.logic';
import type { ShareFilterProps } from './ShareFilter.types';

interface ShareRingsProps
  extends Pick<ShareFilterProps, 'label' | 'items' | 'pressed' | 'onPress'> {
  className?: string;
  style?: CSSProperties;
}

/** `layout="rings"`: a row of share rings, each a toggle that scopes the list to its part. */
export function ShareRings({ label, items, pressed, onPress, className, style }: ShareRingsProps) {
  const { number } = useFormat();
  const total = totalOf(items);
  return (
    <fieldset
      className={classNames('hg-share-filter', className)}
      data-layout="rings"
      aria-label={label}
      style={style}
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          className={`hg-share-filter-ring hg-share-hue-${item.hue}`}
          accessibilityLabel={item.accessibleLabel}
          accessibilityState={{ selected: pressed === item.id }}
          onPress={() => onPress(item.id)}
        >
          <ProgressRing size="dial" share={arcShare(item.count, total)} ink={HUE_INK[item.hue]}>
            <span className="hg-share-filter-dial-count">{number(item.count)}</span>
          </ProgressRing>
          <span className="hg-share-filter-ring-label" data-asks={item.asks === true}>
            {item.label}
          </span>
        </Pressable>
      ))}
    </fieldset>
  );
}
