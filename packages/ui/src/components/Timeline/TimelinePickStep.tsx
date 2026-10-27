// biome-ignore-all lint/a11y/useSemanticElements: the STEP is the radio — an <input> cannot hold a
// node, a name, its marks, a line and the tranches already due there.

/* One step of the pick (web) — its place on the neutral rail with its own glyph in the node, what
   it says, and the check at the row's end. The step IS the radio, so everything it holds is
   static: a focusable child would be a control inside a control. The rail and the check are
   drawn, never read — the step's words are its name. */

import type { KeyboardEvent, Ref } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { TimelineItem } from './Timeline.types';

export function TimelinePickStep({
  item,
  checked,
  tabStop,
  isFirst,
  isLast,
  stepRef,
  onChoose,
  onKeyDown,
}: {
  item: TimelineItem;
  checked: boolean;
  tabStop: boolean;
  isFirst: boolean;
  isLast: boolean;
  stepRef: Ref<HTMLButtonElement>;
  onChoose: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      ref={stepRef}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabStop ? 0 : -1}
      className="hg-timeline-pick-step"
      data-checked={checked}
      onClick={onChoose}
      onKeyDown={onKeyDown}
    >
      <span aria-hidden="true" className="hg-timeline-pick-rail-cell">
        <span className="hg-timeline-pick-rail" data-part="before" data-drawn={!isFirst} />
        <span
          className="hg-timeline-pick-node"
          data-checked={checked}
          data-tone={item.tone ?? 'neutral'}
        >
          {item.icon}
        </span>
        <span className="hg-timeline-pick-rail" data-part="after" data-drawn={!isLast} />
      </span>
      <span className="hg-timeline-pick-body">
        <span className="hg-timeline-pick-head">
          <span className="hg-timeline-pick-label" data-checked={checked}>
            {item.label}
          </span>
          {item.marks}
        </span>
        {item.description ? (
          <span className="hg-timeline-pick-description">{item.description}</span>
        ) : null}
        {item.content ? <span className="hg-timeline-pick-content">{item.content}</span> : null}
      </span>
      <span aria-hidden="true" className="hg-timeline-pick-end">
        <span className="hg-timeline-pick-check" data-checked={checked}>
          {checked ? <ShellGlyph name="tick" size="sm" tone="inverse" /> : null}
        </span>
      </span>
    </button>
  );
}
