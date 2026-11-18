import type { TranslatedText } from '@heliogrid/contracts';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import { Button } from '../Button';
import { NamedGap } from '../NamedGap';
import { StatusMark } from '../StatusMark';
import { LeadDesignList } from './LeadDesignList';
import { LeadFileList } from './LeadFileList';
import { LeadProposalList } from './LeadProposalList';
import type { LeadSectionsProps, LeadSitePanelFacts, LeadSiteVisit } from './LeadSections.types';
import { LeadTaskList } from './LeadTaskList';

/** The one section in view: the caller's timeline, or the site, designs, proposals, tasks or files. */
export function LeadSectionPanel(props: LeadSectionsProps) {
  const { section, counts, words } = props;
  switch (section) {
    case 'timeline':
      return props.timeline;
    case 'site':
      return <Site site={props.site} visit={props.visit} words={words} />;
    case 'designs':
      return <LeadDesignList panel={props.designs} />;
    case 'proposals':
      if (props.proposals !== undefined) return <LeadProposalList panel={props.proposals} />;
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
      return <LeadFileList files={props.files} words={words} />;
  }
}

function Site({
  site,
  visit,
  words,
}: {
  site: LeadSitePanelFacts;
  visit: LeadSiteVisit | null;
  words: LeadSectionsProps['words'];
}) {
  return (
    <div className="hg-lead-section-site">
      <div className="hg-lead-section-head">
        <span className="hg-lead-section-overline hg-overline">{words.site}</span>
        {site.confirmed ? <StatusMark tone="success" label={words.confirmed} /> : null}
      </div>
      {site.address === null && site.facts.length === 0 ? <NamedGap gap={words.siteGap} /> : null}
      {site.address === null ? null : (
        <p className="hg-lead-section-address">
          <ShellGlyph name="pin" size="sm" tone="secondary" />
          <span>{site.address}</span>
        </p>
      )}
      {site.facts.length === 0 ? null : (
        <dl className="hg-lead-section-facts">
          {site.facts.map((fact) => (
            <div key={fact.key}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
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
