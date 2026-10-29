import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { stackedBanners } from './Banner.logic';
import type { BannerStackProps } from './Banner.types';

interface WebBannerStackProps extends BannerStackProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Surfaces resolve multiple true facts two different ways, so this supports both. `mode="stack"`
 * shows them all (capped by `max`); `mode="single"` applies the precedence rule — the broadest true
 * fact speaks, so a user never gets two banners for one act.
 *
 * NEITHER MECHANISM MAY HIDE A MANDATORY BANNER. Every NEVER_DISMISSIBLE banner renders, in
 * precedence order, and the cap applies to the REST. That is the same ruling as `dismissible`, one
 * layer up.
 */
export function BannerStack({
  children,
  mode = 'stack',
  max = 3,
  gap = 8,
  moreLabel,
  className,
  style,
}: WebBannerStackProps) {
  const { shown, hidden, saysMore } = stackedBanners(children, mode, max);
  if (shown.length === 0) {
    return null;
  }
  return (
    <div className={classNames('hg-banner-stack', className)} style={{ gap: `${gap}px`, ...style }}>
      {shown}
      {saysMore ? <span className="hg-banner-stack-more">{moreLabel(hidden)}</span> : null}
    </div>
  );
}
