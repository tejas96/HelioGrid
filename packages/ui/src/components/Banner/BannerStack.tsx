import type { CSSProperties, ReactElement } from 'react';
import { Children, isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import { bannerRank, isNeverDismissible } from './Banner.kinds';
import type { BannerProps, BannerStackProps } from './Banner.types';

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
  className,
  style,
}: WebBannerStackProps) {
  const items = Children.toArray(children).filter((child): child is ReactElement<BannerProps> =>
    isValidElement<BannerProps>(child),
  );
  const ordered = [...items].sort((a, b) => bannerRank(a.props.kind) - bannerRank(b.props.kind));
  const mandatory = ordered.filter((el) => isNeverDismissible(el.props.kind));
  const rest = ordered.filter((el) => !isNeverDismissible(el.props.kind));
  const room =
    mode === 'single' ? (mandatory.length > 0 ? 0 : 1) : Math.max(0, max - mandatory.length);
  const shown = [...mandatory, ...rest.slice(0, room)].sort(
    (a, b) => bannerRank(a.props.kind) - bannerRank(b.props.kind),
  );
  const hidden = ordered.length - shown.length;
  if (shown.length === 0) {
    return null;
  }
  return (
    <div className={classNames('hg-banner-stack', className)} style={{ gap: `${gap}px`, ...style }}>
      {shown}
      {mode === 'stack' && hidden > 0 ? (
        <span className="hg-banner-stack-more">
          {`${hidden} more ${hidden === 1 ? 'notice' : 'notices'} on this screen`}
        </span>
      ) : null}
    </div>
  );
}
