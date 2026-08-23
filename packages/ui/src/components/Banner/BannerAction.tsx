import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import type { BannerActionProps } from './Banner.types';

interface WebBannerActionProps extends BannerActionProps {
  className?: string;
  /** Lands on the PILL — the thing a caller can see, not the invisible 44px target. */
  style?: CSSProperties;
}

/**
 * Inline text action for a banner — "Take the new value", "Pay now". Never a filled button.
 *
 * THE TARGET AND THE VISIBLE PILL ARE TWO DIFFERENT RECTANGLES — the treatment `FilterBar` states
 * for its parts (N2 / F7-29 / F7-32). The BUTTON is the Pressable primitive, so it carries the
 * 44px floor; the pill inside it stays 32, which keeps a banner's density unchanged. The negative
 * margin is the 6px per side the target borrows back, so a banner does not grow by 12px to gain a
 * target.
 */
export function BannerAction({ children, onClick, className, style }: WebBannerActionProps) {
  return (
    <Pressable className="hg-banner-action" onPress={onClick}>
      <span className={classNames('hg-banner-action-pill', className)} style={style}>
        {children}
      </span>
    </Pressable>
  );
}
