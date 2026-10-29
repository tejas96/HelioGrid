import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import { renderProvenance } from '../Provenance';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { shownCountOf } from './Block.logic';
import type { BlockProps } from './Block.types';
import { BlockBody } from './BlockBody';
import { BlockGrid } from './BlockGrid';
import { BlockHeader } from './BlockHeader';

type WebBlockProps = BlockProps & {
  className?: string;
  style?: CSSProperties;
};

/**
 * The section — header, body, footer, and the `read` it shows, a heading on the page (`F7-49`).
 * The header stays put through them all.
 */
export function Block({
  overline,
  title,
  meta,
  action,
  footer,
  provenance,
  read,
  loadingLabel,
  emptyMessage,
  emptyTitle,
  emptyAction,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  badge,
  count,
  countMax,
  countLabel,
  density = 'expressive',
  children,
  className,
  style,
}: WebBlockProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  const frame = useRef<HTMLElement>(null);
  const market = useFormat();
  const prov = renderProvenance(provenance, { size: 12 });
  const shownCount = shownCountOf(count, countMax, market);

  return (
    /* A block that shows a read is where focus lands once its retry has left; a static block is no
       stop at all, so it takes no tabindex. */
    <section
      ref={frame}
      aria-label={title}
      tabIndex={read !== undefined ? -1 : undefined}
      className={classNames(
        'hg-block',
        read !== undefined ? 'hg-focus-target' : undefined,
        className,
      )}
      data-density={density}
      style={style}
    >
      <BlockHeader
        overline={overline}
        title={title}
        meta={meta}
        action={action}
        badge={badge}
        countLabel={countLabel}
        shownCount={shownCount}
      />

      <BlockBody
        state={state}
        loadingLabel={loadingLabel}
        emptyMessage={emptyMessage}
        emptyTitle={emptyTitle}
        emptyAction={emptyAction}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        focusAfter={frame}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
      >
        {children}
      </BlockBody>

      {prov !== null || footer !== undefined ? (
        <footer className="hg-block-foot">
          {prov}
          {footer !== undefined ? <div className="hg-block-foot-end">{footer}</div> : null}
        </footer>
      ) : null}
    </section>
  );
}

/* `Block.Grid` — the seam reachable from the component the docs name it on. */
Block.Grid = BlockGrid;
