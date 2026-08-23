import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import { ActorClass } from '../ActorClass';
import { renderMarks } from '../ChipGroup';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import { ActivityGlyph } from './ActivityGlyph';
import { asDate, hhmm, isValidDate, kindOf } from './ActivityStream.kinds';
import type { ActivityEntry, ActivityKindSpec } from './ActivityStream.types';

export interface StreamEntryProps {
  entry: ActivityEntry;
  kinds: Record<string, ActivityKindSpec>;
  density: 'expressive' | 'functional';
  format: MarketFormat;
}

/** One entry: the kind's mark, the kind's word, the clock, the summary and the actor class. */
export function StreamEntry({ entry, kinds, density, format }: StreamEntryProps) {
  const spec = kindOf(kinds, entry.kind);
  const date = asDate(entry.at);
  const valid = isValidDate(date);
  const summary: ReactNode =
    entry.onOpen !== undefined ? (
      <button type="button" className="hg-stream-summary-button" onClick={entry.onOpen}>
        {entry.summary}
      </button>
    ) : (
      <span className="hg-stream-summary">{entry.summary}</span>
    );
  return (
    <li className="hg-stream-entry">
      <span aria-hidden="true" className="hg-stream-mark" data-tone={spec.tone}>
        <ActivityGlyph name={spec.glyph} size={density === 'functional' ? 15 : 17} />
      </span>
      <div className="hg-stream-body">
        <div className="hg-stream-head">
          {/* The kind is a word on the entry, not a colour on the mark. */}
          <span className="hg-stream-kind">{spec.label}</span>
          {valid ? <span className="hg-stream-time">{format.time(hhmm(date))}</span> : null}
        </div>
        <div className="hg-stream-summary-row">{summary}</div>
        {entry.detail !== undefined ? <p className="hg-stream-detail">{entry.detail}</p> : null}
        {/* THE ACTOR CLASS, always in words — one vocabulary, shared with a task's `origin`. */}
        <div className="hg-stream-actor">
          <ActorClass actorClass={entry.actorClass} actor={entry.actor} size={12} />
        </div>
        {entry.marks !== undefined ? (
          <div className="hg-stream-marks">{renderMarks(entry.marks)}</div>
        ) : null}
        {entry.provenance !== undefined ? (
          <div className="hg-stream-tier">
            {renderProvenance(entry.provenance as ProvenanceProps | ReactNode, { size: 12 })}
          </div>
        ) : null}
        {entry.content !== undefined ? (
          <div className="hg-stream-content">{entry.content}</div>
        ) : null}
        {entry.action !== undefined ? <div className="hg-stream-action">{entry.action}</div> : null}
      </div>
    </li>
  );
}
