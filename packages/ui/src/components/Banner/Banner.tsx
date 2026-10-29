import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { NO_FOCUS_AFTER, useFocusAfter } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { bannerKind } from './Banner.kinds';
import {
  ACTION_BELOW,
  actionStacks,
  BANNER_GLYPH,
  bannerDismissal,
  useDisclaimerWarning,
  useFormReport,
} from './Banner.logic';
import type { BannerGlyph, BannerProps } from './Banner.types';

type WebBannerProps = BannerProps & {
  className?: string;
  style?: CSSProperties;
};

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
      <ShellGlyphMarks name={BANNER_GLYPH[name]} />
    </svg>
  );
}

/** The copy column: the title, the body, and the action when it has dropped under the body. */
function Content({
  title,
  children,
  actionBelowBody,
}: {
  title?: TranslatedText;
  children?: ReactNode;
  actionBelowBody?: ReactNode;
}) {
  return (
    <div className="hg-banner-content">
      {title === undefined ? null : <div className="hg-banner-title">{title}</div>}
      {children === undefined || children === null ? null : (
        <div className="hg-banner-body" data-has-title={title === undefined ? undefined : 'true'}>
          {children}
        </div>
      )}
      {actionBelowBody === undefined ? null : (
        <div className="hg-banner-action-row">{actionBelowBody}</div>
      )}
    </div>
  );
}

/** The in-page statement of a fact about what's on screen. Never covers content, never blocks. */
export function Banner({
  kind = 'state',
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  focusAfter,
  dismissible,
  tone,
  variant = 'block',
  density = 'expressive',
  icon,
  actionBelow = ACTION_BELOW,
  onFormChange,
  className,
  style,
}: WebBannerProps) {
  const meta = bannerKind(kind);
  const dismissal = bannerDismissal({ dismissible, kind, onDismiss, dismissLabel });
  const leaving = useFocusAfter(focusAfter ?? NO_FOCUS_AFTER);
  const width = useOwnWidth(variant === 'block');
  const stacked = actionStacks(action !== undefined, width.value, actionBelow);
  useFormReport(stacked, width.value, onFormChange);
  useDisclaimerWarning(kind);

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
      ref={width.ref}
      role={meta.role}
      className={classNames('hg-banner', className)}
      data-tone={tone ?? meta.tone}
      data-density={density}
      style={style}
    >
      {icon ?? <Glyph name={meta.icon} size={17} />}
      <Content title={title} actionBelowBody={stacked ? action : undefined}>
        {children}
      </Content>
      {action === undefined || stacked ? null : (
        <div className="hg-banner-action-slot">{action}</div>
      )}
      {dismissal === null ? null : (
        <Pressable
          className="hg-banner-dismiss"
          accessibilityLabel={dismissal.label}
          onPress={leaving(dismissal.onDismiss)}
        >
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
            <ShellGlyphMarks name="close" />
          </svg>
        </Pressable>
      )}
    </div>
  );
}

/**
 * The banner's own outer layout width, observed — never the viewport's; `null` until first
 * measured. The border box, as the phone's `onLayout` reports it: `contentRect` leaves out the
 * padding, and `getBoundingClientRect` would read a banner inside a scaled preview at its scale.
 */
function useOwnWidth(observed: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!observed || element === null) return;
    /* No first read: an observer reports once when it starts, so the width has one source. */
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize[0];
      if (box !== undefined) setValue(box.inlineSize);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [observed]);
  return { ref, value };
}
