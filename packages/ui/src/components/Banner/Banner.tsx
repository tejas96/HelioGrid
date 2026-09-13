import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { bannerKind, isNeverDismissible } from './Banner.kinds';
import { BANNER_GLYPH } from './Banner.logic';
import type { BannerGlyph, BannerProps } from './Banner.types';

interface WebBannerProps extends BannerProps {
  className?: string;
  style?: CSSProperties;
}

function Glyph({ name, size }: { name: BannerGlyph; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="hg-banner-glyph"
    >
      {BANNER_GLYPH[name].ringed ? <circle cx="12" cy="12" r="9" /> : null}
      {BANNER_GLYPH[name].paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The in-page statement of a fact about what's on screen. Never covers content, never blocks. */
export function Banner({
  kind = 'state',
  title,
  children,
  action,
  onDismiss,
  dismissible,
  tone,
  variant = 'block',
  density = 'expressive',
  icon,
  className,
  style,
}: WebBannerProps) {
  const meta = bannerKind(kind);
  const canDismiss = (dismissible ?? false) && !isNeverDismissible(kind) && onDismiss !== undefined;
  useEffect(() => {
    if (kind === 'disclaimer') {
      console.warn(
        'Banner kind="disclaimer" is superseded by <Disclosure>. M06-04 / SCR-M06-17 require the line in the reading flow at the weight of the figures it qualifies, on the customer\'s own surface — a banner is operator chrome (MS9-11), it can be capped by BannerStack, and its strip is the wrong weight. This banner is never dismissible, but move it.',
      );
    }
  }, [kind]);

  if (variant === 'pill') {
    return (
      <div
        role={meta.role}
        className={classNames('hg-banner-pill', className)}
        data-tone={tone ?? meta.tone}
        style={style}
      >
        {icon ?? <Glyph name={meta.icon} size={16} />}
        <span>{title ?? children}</span>
        {action}
      </div>
    );
  }

  return (
    <div
      role={meta.role}
      className={classNames('hg-banner', className)}
      data-tone={tone ?? meta.tone}
      data-density={density}
      style={style}
    >
      {icon ?? <Glyph name={meta.icon} size={17} />}
      <div className="hg-banner-content">
        {title === undefined ? null : <div className="hg-banner-title">{title}</div>}
        {children === undefined || children === null ? null : (
          <div className="hg-banner-body" data-has-title={title === undefined ? undefined : 'true'}>
            {children}
          </div>
        )}
      </div>
      {action === undefined ? null : <div className="hg-banner-action-slot">{action}</div>}
      {canDismiss ? (
        <Pressable className="hg-banner-dismiss" accessibilityLabel="Dismiss" onPress={onDismiss}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Pressable>
      ) : null}
    </div>
  );
}
