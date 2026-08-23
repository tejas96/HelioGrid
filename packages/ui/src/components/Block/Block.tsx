import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import type { BlockProps } from './Block.types';
import { blockCount } from './Block.types';
import { BlockBody } from './BlockBody';
import { BlockGrid } from './BlockGrid';
import { BlockHeader } from './BlockHeader';

interface WebBlockProps extends BlockProps {
  className?: string;
  style?: CSSProperties;
}

/** The section frame — header, body, footer, and a `state`. The header stays put through them all. */
export function Block({
  overline,
  title,
  meta,
  action,
  footer,
  provenance,
  state = 'ready',
  emptyMessage = 'Nothing here yet.',
  emptyTitle,
  emptyAction,
  errorTitle = "Couldn't load this",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'Not available',
  unavailableMessage,
  badge,
  count,
  countMax,
  countLabel,
  density = 'expressive',
  flat = false,
  children,
  className,
  style,
}: WebBlockProps) {
  const market = useFormat();
  const prov = renderProvenance(provenance as ProvenanceProps | ReactNode, { size: 12 });
  const shownCount = blockCount(count, countMax, (n) =>
    market.number(n, { maximumFractionDigits: 0 }),
  );

  return (
    <section
      aria-label={title}
      className={classNames('hg-block', className)}
      data-density={density}
      data-flat={flat ? 'true' : undefined}
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
        title={title}
        state={state}
        emptyMessage={emptyMessage}
        emptyTitle={emptyTitle}
        emptyAction={emptyAction}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
        onRetry={onRetry}
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
