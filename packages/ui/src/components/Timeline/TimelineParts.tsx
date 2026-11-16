/* Timeline's node, skeleton and message (web). Split out by responsibility — the sequence itself
   is Timeline.tsx.

   Status is never colour alone: each state carries its own glyph inside the node — a tick for
   `done`, a filled dot for `current`, a bang for `blocked`, a cross for `failed` — and `upcoming`
   is an empty disc, which is its own shape. */

import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { RetryButton } from '../Button/RetryButton';
import { StateRegion } from '../StateBody';
import { messageGlyphOf, NODE_GLYPH, nodeGlyphSize } from './Timeline.logic';
import type { TimelineStatus } from './Timeline.types';

/**
 * The caller's class and style, on whichever state draws the root of a timeline that shows no
 * read. A timeline that shows a read wraps its states in one frame, which carries them instead.
 */
export interface TimelineRoot {
  className?: string;
  style?: CSSProperties;
}

/** The node. `size` is the DS's own node ladder (28 page / 20 compact); it lives in Timeline.css. */
export function TimelineNode({
  status = 'upcoming',
  compact,
  icon,
}: {
  status?: TimelineStatus;
  compact: boolean;
  /** The current step's own glyph, in place of its dot. */
  icon?: ReactNode;
}) {
  const inner = nodeGlyphSize(compact);
  const own = status === 'current' && icon !== undefined;
  const mark = status === undefined ? undefined : NODE_GLYPH[status];
  return (
    <span
      aria-hidden="true"
      className="hg-timeline-node"
      data-status={status}
      data-icon={own ? 'true' : undefined}
    >
      {mark === undefined ? null : <ShellGlyph name={mark} size={inner} tone="current" />}
      {own ? icon : null}
      {status === 'current' && !own ? <span className="hg-timeline-node-core" /> : null}
    </span>
  );
}

export function TimelineSkeleton({ label, root }: { label?: TranslatedText; root: TimelineRoot }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={classNames('hg-timeline-skeleton', root.className)}
      style={root.style}
    >
      {['a', 'b', 'c', 'd'].map((row) => (
        <div key={row} className="hg-timeline-skeleton-row">
          <span className="hg-timeline-skeleton-node" />
          <div className="hg-timeline-skeleton-lines">
            <div className="hg-timeline-skeleton-bar hg-skeleton" data-bar="title" />
            <div className="hg-timeline-skeleton-bar hg-skeleton" data-bar="meta" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  focusAfter,
  root,
}: {
  tone?: 'warning';
  title?: TranslatedText;
  message?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  focusAfter: FocusAfter;
  root: TimelineRoot;
}) {
  return (
    <StateRegion
      tone={tone}
      glyph={messageGlyphOf(tone)}
      title={title}
      message={message}
      action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
      className={classNames('hg-timeline-message', root.className)}
      style={root.style}
    />
  );
}
