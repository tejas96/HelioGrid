import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { AppShellProps } from './AppShell.types';
import { BarScrollContext, createBarScroll } from './MobileTopBar.logic';
import { useBarFade } from './use-bar-fade';
import { useRailFollow } from './use-rail-follow';

interface WebAppShellProps extends AppShellProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Rail on the left, then the content column, which scrolls. The header and the billing strip are
 * pinned at the column's top INSIDE the scroll, as one region: what scrolls passes under them and
 * their one frosted band comes in with the distance (`BarScrollContext`), so nothing is cut off
 * at a hard edge and nothing turns solid in one frame. When the rail folds or opens, the page
 * and the rail's panel glide to their new places (`useRailFollow`).
 */
export function AppShell({
  rail,
  header,
  strip,
  page,
  children,
  className,
  style,
}: WebAppShellProps) {
  const scroll = useMemo(createBarScroll, []);
  const main = useRef<HTMLElement>(null);
  const railBox = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  useRailFollow(railBox, column);
  // A new page opens at its top (`page`), never where the last one was scrolled to.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `page` is the trigger, not a value read
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [page]);
  return (
    <BarScrollContext.Provider value={scroll}>
      <div className={classNames('hg-app-shell', className)} style={style}>
        <div ref={railBox} className="hg-app-shell-rail">
          {rail}
        </div>
        <div ref={column} className="hg-app-shell-column">
          <main
            ref={main}
            className="hg-app-shell-main"
            onScroll={(event) => scroll.tell(event.currentTarget.scrollTop)}
          >
            <PinnedTop>
              {header}
              {strip}
            </PinnedTop>
            {children}
          </main>
        </div>
      </div>
    </BarScrollContext.Provider>
  );
}

/** The pinned region: its frosted band rides the scroll's distance, as a bar's does. */
function PinnedTop({ children }: { children: ReactNode }) {
  const top = useRef<HTMLDivElement>(null);
  useBarFade(top);
  return (
    <div ref={top} className="hg-app-shell-top">
      {children}
    </div>
  );
}
