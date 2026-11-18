import { type RefObject, useRef } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { EmptyScene } from '../EmptyScene';
import { FailedRead } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { PendingAction } from '../PendingAction';
import { LeadDesignCard } from './LeadDesignCard';
import {
  leadDesignsNoneLineOf,
  leadDesignsNoteOf,
  leadDesignsOf,
  mayChangeDesigns,
} from './LeadSections.designs';
import { leadDesignsFailedOf } from './LeadSections.logic';
import type { LeadDesignsPanel } from './LeadSections.types';
// The empty scene's frame and words are the Proposals section's, drawn by its own classes.
import './LeadProposalList.css';
import './LeadDesignList.css';

interface LeadDesignListProps {
  readonly panel: LeadDesignsPanel;
}

/**
 * The Designs section, on the web (`T-M05-001`): the lead's designs as cards in a grid, or the
 * empty scene with *Create design*. One frame holds every state, so focus sent to it after
 * *Try again* stays while the designs read again.
 */
export function LeadDesignList({ panel }: LeadDesignListProps) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div ref={frame} tabIndex={-1} className="hg-lead-designs hg-focus-target">
      <Designs panel={panel} frame={frame} />
    </div>
  );
}

function Designs({
  panel,
  frame,
}: LeadDesignListProps & { frame: RefObject<HTMLDivElement | null> }) {
  const { read, words } = panel;
  if (read.kind === 'loading') return <LoadingBars bars={['panel']} label={words.loading} />;
  if (read.kind === 'failed') {
    return <FailedRead {...leadDesignsFailedOf(read.retry, words, frame)} />;
  }
  const designs = leadDesignsOf(panel);
  if (designs.length === 0) return <None panel={panel} />;
  const note = leadDesignsNoteOf(panel);
  return (
    <>
      {note === null ? null : <p className="hg-lead-section-line">{note}</p>}
      <Undone panel={panel} />
      <ul className="hg-lead-designs-grid">
        {designs.map((design) => (
          <LeadDesignCard key={design.id} design={design} panel={panel} />
        ))}
      </ul>
    </>
  );
}

/** No design yet: the scene, what the section is for — or why a closed lead takes none — and the create. */
function None({ panel }: LeadDesignListProps) {
  const { words } = panel;
  const line = leadDesignsNoneLineOf(panel);
  return (
    <div className="hg-lead-proposals-empty">
      <EmptyScene name="settle" size="compact" />
      <span className="hg-lead-proposal-words">
        <b>{words.noneTitle}</b>
        {line === null ? null : <span>{line}</span>}
      </span>
      {mayChangeDesigns(panel) ? (
        <Button
          variant="primary"
          size="md"
          icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
          loading={panel.busy}
          onClick={panel.onCreate}
        >
          {words.create}
        </Button>
      ) : null}
      <Undone panel={panel} />
    </div>
  );
}

/** The act that came back undone, said in the section it was made in. */
function Undone({ panel }: LeadDesignListProps) {
  return panel.failure === null ? null : <PendingAction state="returned" reason={panel.failure} />;
}
