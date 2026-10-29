/* ReadAlongside (web) — THE ARRANGEMENT, so nineteen review screens don't each answer it.

   "Alongside" is a layout claim, and on a 375px phone there is no alongside. One component measures
   THE LAYER IT MOUNTS INTO (never the viewport, law 4) and performs the switch:

     ≥ `breakpoint` of its OWN width — two columns, the document sticky so it stays beside the field
       being checked however far the form scrolls.
     < `breakpoint` — stacked, DOCUMENT FIRST at a reading height with an expand toggle, because the
       source is the reference and a reference under 40 fields is one nobody scrolls back to. */

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { ALONGSIDE_DEFAULTS, documentAtHeight, sitsAlongside } from './SourceDocument.logic';
import type { ReadAlongsideProps } from './SourceDocument.types';

interface WebReadAlongsideProps extends ReadAlongsideProps {
  className?: string;
  style?: CSSProperties;
}

export function ReadAlongside({
  document: doc,
  children,
  breakpoint = ALONGSIDE_DEFAULTS.breakpoint,
  documentWidth = ALONGSIDE_DEFAULTS.documentWidth,
  stackedHeight = ALONGSIDE_DEFAULTS.stackedHeight,
  expandedHeight = ALONGSIDE_DEFAULTS.expandedHeight,
  expandLabel,
  collapseLabel,
  gap = ALONGSIDE_DEFAULTS.gap,
  label,
  className,
  style,
}: WebReadAlongsideProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [big, setBig] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const side = sitsAlongside(width, breakpoint);
  const sized = documentAtHeight(doc, { side, expanded: big, stackedHeight, expandedHeight });

  return (
    // biome-ignore lint/a11y/useSemanticElements: role="group" pairs with <fieldset>, a form grouping; this is a two-column reading arrangement, not a form.
    <div
      ref={ref}
      role="group"
      aria-label={label || undefined}
      className={classNames('hg-read-alongside', className)}
      data-side={side ? 'true' : undefined}
      style={{ gap, ...style }}
    >
      <div className="hg-read-alongside-doc" style={side ? { width: documentWidth } : undefined}>
        {sized}
        {side ? null : (
          /* A toggle that cannot say whether it is open is not reachable, so the expanded state
             goes through the primitive — `aria-expanded` here, `accessibilityState.expanded` on
             the native half, one declaration — and the 44px floor comes with it. */
          <Pressable
            className="hg-read-alongside-toggle"
            accessibilityState={{ expanded: big }}
            onPress={() => setBig((b) => !b)}
          >
            {big ? collapseLabel : expandLabel}
          </Pressable>
        )}
      </div>
      <div className="hg-read-alongside-form">{children}</div>
    </div>
  );
}
