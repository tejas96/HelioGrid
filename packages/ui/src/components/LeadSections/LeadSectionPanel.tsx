import type { TranslatedText } from '@heliogrid/contracts';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import { Button } from '../Button';
import { NamedGap } from '../NamedGap';
import type { LeadSectionsProps, LeadSiteVisit } from './LeadSections.types';
import { LeadTaskList } from './LeadTaskList';

/** The one section in view: the caller's timeline, or the site, designs, proposals, tasks or files. */
export function LeadSectionPanel(props: LeadSectionsProps) {
  const { section, counts, words } = props;
  switch (section) {
    case 'timeline':
      return props.timeline;
    case 'site':
      return <Site address={props.siteAddress} visit={props.visit} words={words} />;
    case 'designs':
      return (
        <Count
          glyph="solar-panel"
          count={counts.designs ?? 0}
          words={{ some: words.designs, none: words.noDesign, line: words.designsLine }}
        />
      );
    case 'proposals':
      return (
        <Count
          glyph="document"
          count={counts.proposals ?? 0}
          words={{ some: words.proposals, none: words.noProposal, line: words.proposalsLine }}
        />
      );
    case 'tasks':
      return <LeadTaskList tasks={props.tasks} acts={props.taskActs} words={words} />;
    case 'files':
      return (
        <Count
          glyph="file"
          count={counts.files ?? 0}
          words={{ some: words.files, none: words.noFiles, line: words.filesLine }}
        />
      );
  }
}

function Site({
  address,
  visit,
  words,
}: {
  address: string | null;
  visit: LeadSiteVisit | null;
  words: LeadSectionsProps['words'];
}) {
  return (
    <div className="hg-lead-section-site">
      <div className="hg-lead-section-head">
        <span className="hg-lead-section-overline">{words.site}</span>
        {visit === null ? null : <StatusMark tone="success" label={words.confirmed} />}
      </div>
      {address === null ? (
        <NamedGap gap={words.siteGap} />
      ) : (
        <p className="hg-lead-section-address">
          <ShellGlyph name="pin" size="sm" tone="secondary" />
          <span>{address}</span>
        </p>
      )}
      {visit === null ? null : (
        <>
          <p className="hg-lead-section-line">{visit.line}</p>
          <div className="hg-lead-section-acts">
            <Button variant="secondary" size="sm" onClick={visit.onConfirmation}>
              {words.confirmation}
            </Button>
            <Button variant="ghost" size="sm" onClick={visit.onReschedule}>
              {words.reschedule}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface CountWords {
  some: (count: number) => TranslatedText;
  none: TranslatedText;
  line: TranslatedText;
}

/** A section the read only counts: how many, or its named gap, and the line saying where they come from. */
function Count({
  glyph,
  count,
  words,
}: {
  glyph: ShellGlyphName;
  count: number;
  words: CountWords;
}) {
  return (
    <div className="hg-lead-section-count">
      <span className="hg-lead-section-count-mark" aria-hidden="true">
        <ShellGlyph name={glyph} size="md" tone="secondary" />
      </span>
      <div className="hg-lead-section-count-words">
        {count === 0 ? (
          <NamedGap gap={words.none} />
        ) : (
          <span className="hg-lead-section-count-value">{words.some(count)}</span>
        )}
        <span className="hg-lead-section-line">{words.line}</span>
      </div>
    </div>
  );
}
