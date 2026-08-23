import type { ReactNode } from 'react';
import { Text } from '../../primitives/Text';
import type { BlockProps } from './Block.types';

export interface BlockHeaderProps
  extends Pick<BlockProps, 'overline' | 'title' | 'meta' | 'action' | 'badge' | 'countLabel'> {
  /** The grouped numeral, already clamped and formatted; `null` draws nothing. */
  shownCount: string | null;
}

/** A TOTAL beside a heading, not an unread badge — grouped, tabular, and never clamped by default. */
function BlockCount({ shownCount, countLabel }: { shownCount: string; countLabel?: string }) {
  return (
    <span className="hg-block-count">
      <span aria-hidden="true">{shownCount}</span>
      {/* NAME_FROM_CONTENT (check h): the bare numeral is hidden and "6 sites" is exposed as
          CONTENT — this is where the native half's `accessibilityLabel` sentence lives on the web.
          Through the DS `Text` primitive rather than a bare `<span>` so the name SOURCE is
          declared: a clipped node the parity gate cannot see is a name nobody can audit. */}
      <Text as="span" className="hg-block-sr">
        {countLabel !== undefined ? `${shownCount} ${countLabel}` : shownCount}
      </Text>
    </span>
  );
}

/**
 * The header row draws for a title, a count OR a badge — the `<h2>` is the optional part. It used
 * to render inside the `title` branch, so an overline-only block (`overline="AGENT CALLS"`,
 * `count={6}` — the `SCR-M07-01` / `M13-10` shape) drew an empty row and dropped the numeral.
 */
export function BlockHeader({
  overline,
  title,
  meta,
  action,
  badge,
  countLabel,
  shownCount,
}: BlockHeaderProps): ReactNode {
  const titleRow = title !== undefined || shownCount !== null || badge !== undefined;
  if (overline === undefined && !titleRow && meta === undefined && action === undefined) {
    return null;
  }
  return (
    <header className="hg-block-head">
      <div className="hg-block-head-main">
        {overline !== undefined ? (
          <div className="hg-block-overline" data-spaced={titleRow ? 'true' : undefined}>
            {overline}
          </div>
        ) : null}
        {titleRow ? (
          <div className="hg-block-title-row">
            {title !== undefined ? <h2 className="hg-block-title">{title}</h2> : null}
            {shownCount !== null ? (
              <BlockCount shownCount={shownCount} countLabel={countLabel} />
            ) : null}
            {badge}
          </div>
        ) : null}
        {/* M08-16: the object this block reads, and the version in force. */}
        {meta !== undefined ? <div className="hg-block-meta">{meta}</div> : null}
      </div>
      {action !== undefined ? <div className="hg-block-action">{action}</div> : null}
    </header>
  );
}
