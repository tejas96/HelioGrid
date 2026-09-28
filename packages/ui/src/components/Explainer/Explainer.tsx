/// <reference lib="dom" />
import type { CSSProperties, FocusEvent } from 'react';
import { useEffect, useId, useMemo, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { explainerGeometry } from './Explainer.logic';
import type { ExplainerOpenReason, ExplainerProps } from './Explainer.types';
import { ExplainerBubble } from './ExplainerBubble';
import { InfoGlyph } from './ExplainerParts';
import { useExplainer } from './use-explainer';
import { useExplainerPlace } from './use-explainer-place';

type WebExplainerProps = ExplainerProps & {
  className?: string;
  style?: CSSProperties;
};

function pointerCanHover(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/**
 * The ask (`F7-46`). Opens on tap and on keyboard focus; hover opens it too where the pointer can
 * hover. Closes on Escape, an outside tap and scrolling away, and focus returns to the trigger.
 * NOT modal: the bubble sits right after the trigger in the DOM, so it is in reading order and Tab
 * carries on through the page.
 */
export function Explainer(props: WebExplainerProps) {
  const { label, density = 'expressive', hover = 'auto', inset = false, glyph } = props;
  const ask = useExplainer(props);
  const uid = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const reopenGuard = useRef(false);
  const canHover = useMemo(pointerCanHover, []);
  const hoverOpens = hover === 'auto' ? canHover : hover;

  const trigger = () => wrap.current?.querySelector<HTMLElement>(':scope > .hg-explainer-trigger');
  /* Returning focus must not reopen: programmatic focus can match :focus-visible. */
  const focusTrigger = () => {
    reopenGuard.current = true;
    trigger()?.focus({ preventScroll: true });
    setTimeout(() => {
      reopenGuard.current = false;
    }, 0);
  };
  /** Focus goes back to the trigger when the bubble held it, and always for Escape and the trigger;
   *  an outside tap that landed on another control leaves that control its focus. */
  const close = (reason: ExplainerOpenReason) => {
    const held = bubble.current?.contains(document.activeElement) === true;
    ask.hide(reason);
    if (held || reason === 'escape' || reason === 'trigger') focusTrigger();
  };

  const placed = useExplainerPlace({
    isOpen: ask.isOpen,
    content: ask.content,
    wrap,
    bubble,
    trigger,
    within: props.within,
    placement: props.placement ?? 'bottom',
    density,
    maxWidth: props.maxWidth,
    onScrolledAway: () => close('scroll'),
  });

  /* A deliberate tap moves focus into the bubble so a screen reader reads it on opening. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs as the ask opens, and `openedBy` is a ref.
  useEffect(() => {
    if (ask.isOpen && ask.openedBy.current === 'trigger') {
      bubble.current?.focus({ preventScroll: true });
    }
  }, [ask.isOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: listens only while open; `close` is rebuilt every render.
  useEffect(() => {
    if (!ask.isOpen) return;
    const outside = (event: Event) => {
      if (wrap.current !== null && !wrap.current.contains(event.target as Node)) close('outside');
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
    };
  }, [ask.isOpen]);

  const press = () => {
    if (!ask.isOpen) return ask.show('trigger');
    /* Opened by focus or hover and now deliberately pressed: take it over and move focus in, so a
       keyboard user's Enter never dismisses what their Tab just opened. A second press closes. */
    if (ask.openedBy.current === 'focus' || ask.openedBy.current === 'hover') {
      ask.openedBy.current = 'trigger';
      bubble.current?.focus({ preventScroll: true });
      return;
    }
    close('trigger');
  };

  const onFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.target !== trigger() || ask.isOpen || reopenGuard.current) return;
    if (event.target.matches(':focus-visible')) ask.show('focus');
  };

  if (ask.empty) return null;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the wrapper only mirrors its trigger's hover, focus and Escape; the trigger inside keeps every semantic it has.
    <span
      ref={wrap}
      className={classNames('hg-explainer', props.className)}
      data-density={density}
      data-inset={inset ? 'true' : undefined}
      style={props.style}
      onMouseEnter={() => hoverOpens && !ask.isOpen && ask.show('hover')}
      onMouseLeave={() => ask.isOpen && ask.openedBy.current === 'hover' && close('hover-out')}
      onFocus={onFocus}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && ask.isOpen) {
          event.stopPropagation();
          close('escape');
        }
      }}
    >
      <Pressable
        className="hg-explainer-trigger"
        accessibilityLabel={label}
        accessibilityState={{ expanded: ask.isOpen }}
        onPress={press}
      >
        {glyph ?? <InfoGlyph size={explainerGeometry(density).glyph} />}
      </Pressable>
      {ask.isOpen ? (
        <ExplainerBubble
          bubbleRef={bubble}
          titleId={`${uid}-title`}
          label={label}
          title={props.title}
          placed={placed}
          content={ask.content}
          pager={ask.pager}
          action={props.action}
          showsAction={ask.showsAction}
          onMove={ask.move}
        />
      ) : null}
    </span>
  );
}
