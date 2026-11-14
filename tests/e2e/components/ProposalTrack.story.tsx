import { proposalTrackWords } from '@heliogrid/i18n';
import { ProposalTrack } from '@heliogrid/ui';
import { useRef } from 'react';
import { detailAt } from '../support/proposal-after-sample';
import { DATE_TEXT, NUMBER, SNAPSHOT } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';
import { numberedTerms } from '../support/proposal-long-terms';
import { FORMATS, Frame, READERS } from './ProposalAfter.story';

/**
 * Track over the version on the customer's link, whose terms run to `clauses` clauses — a new
 * version's own length — so its document row counts that version's sheets, not the draft's pages.
 */
export function TrackOfVersionShown({ clauses }: { clauses: number }) {
  const { t } = READERS.en;
  const focus = useRef<HTMLDivElement>(null);
  const snapshot = {
    ...SNAPSHOT,
    fields: { ...SNAPSHOT.fields, terms: numberedTerms(clauses) },
  };
  const shown = {
    snapshot,
    facts: { number: NUMBER, dateText: DATE_TEXT, generationTier: 'estimated' as const },
    words: pageWordsOf(t, snapshot),
  };
  const ignore = () => undefined;
  return (
    <Frame act="" reader="en">
      <div ref={focus} tabIndex={-1}>
        <ProposalTrack
          read={{ kind: 'ready', value: detailAt('shared') }}
          words={proposalTrackWords(t, FORMATS)}
          shown={shown}
          crewMessageDue={false}
          pending={null}
          failure={null}
          onAct={ignore}
          onOpenDocument={ignore}
          onOpenVersions={ignore}
          onOpenLinks={ignore}
          onOpenFollowUp={ignore}
          onThank={ignore}
          onCrewMessage={ignore}
          focusAfter={focus}
        />
      </div>
    </Frame>
  );
}
