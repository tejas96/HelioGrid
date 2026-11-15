import type { SearchRead } from '@heliogrid/domain';
import {
  proposalQuickAddWords,
  proposalReaderWords,
  quickAddWords,
  searchWords,
} from '@heliogrid/i18n';
import { ProposalReader, QuickAddForm, SearchResults } from '@heliogrid/ui';
import { useRef, useState } from 'react';
import { ID } from '../support/proposal-after-sample';
import { DATE_TEXT, NUMBER, SNAPSHOT } from '../support/proposal-document-sample';
import { pageWordsOf } from '../support/proposal-document-words';
import { Frame, READERS, type Reader } from './ProposalAfter.story';

/** The document read in the app (`SCR-M06-17`): its pages, the page pill and the acts. */
export function ReaderAsDrawn({
  room,
  frame = 'ready',
  mayAct = true,
  reader = 'en',
}: {
  room: 'wide' | 'narrow';
  frame?: 'ready' | 'loading' | 'failed';
  /** The reader may make a new version and share; off draws the PDF alone. */
  mayAct?: boolean;
  reader?: Reader;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const focus = useRef<HTMLDivElement>(null);
  const document = {
    snapshot: SNAPSHOT,
    facts: { number: NUMBER, dateText: DATE_TEXT, generationTier: 'estimated' as const },
    words: pageWordsOf(t, SNAPSHOT),
  };
  return (
    <Frame act={act} reader={reader}>
      <div ref={focus} tabIndex={-1} style={{ height: 760 }}>
        <ProposalReader
          read={
            frame === 'ready'
              ? { kind: 'ready', value: document }
              : frame === 'loading'
                ? { kind: 'loading' }
                : { kind: 'failed', failure: 'refused', retry: () => setAct('retry') }
          }
          words={proposalReaderWords(t, 'Anil', 'residential')}
          room={room}
          pageWidth={room === 'wide' ? 620 : 311}
          pending={null}
          {...(mayAct
            ? { onNewVersion: () => setAct('new_version'), onShare: () => setAct('share') }
            : {})}
          onPdf={() => setAct('pdf')}
          focusAfter={focus}
        />
      </div>
    </Frame>
  );
}

/** *Who is it for?* (`T-M06-001`): the capture, with the lead a typed number already belongs to. */
export function QuickAddAsDrawn({
  known = false,
  reader = 'en',
}: {
  known?: boolean;
  reader?: Reader;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const [phone, setPhone] = useState(known ? '+919876543210' : '');
  const words = quickAddWords(t, {
    check: { kind: 'none' },
    phoneRefusal: null,
    saveFailure: null,
    referrer: null,
  });
  const who = proposalQuickAddWords(t, 'Anil Sharma');
  return (
    <Frame act={act} reader={reader}>
      <QuickAddForm
        phoneE164={phone}
        name=""
        city=""
        segment={null}
        onPhone={setPhone}
        onName={() => undefined}
        onCity={() => undefined}
        onSegment={() => undefined}
        check={null}
        phoneRefusal={null}
        phoneFocus={0}
        cameFrom={null}
        saving={false}
        returned={null}
        onSave={() => setAct('save')}
        onRetry={() => undefined}
        onDismissReturned={() => undefined}
        knownLead={known ? { ...who.known, onUse: () => setAct('use') } : null}
        saveNote={who.saveNote}
        words={{ ...words.form, save: who.save }}
      />
    </Frame>
  );
}

const PROPOSAL_ROWS = [
  {
    kind: 'proposal',
    key: `proposal:${ID('e1')}`,
    address: `proposals/${ID('e1')}`,
    id: ID('e1'),
    number: NUMBER,
    customerName: 'Anil Sharma',
    city: 'Pune',
    standing: 'opened',
    exact: true,
  },
  {
    kind: 'proposal',
    key: `proposal:${ID('e2')}`,
    address: `proposals/${ID('e2')}`,
    id: ID('e2'),
    number: null,
    customerName: null,
    city: null,
    standing: 'draft',
    exact: false,
  },
] as const;

const FOUND: SearchRead<never> = {
  kind: 'ready',
  value: {
    groups: [{ group: 'proposals', total: 2, rows: PROPOSAL_ROWS, seeAll: null }],
    order: PROPOSAL_ROWS.map((row) => row.key),
  },
};

/** Search's Proposals group (`F6-20`): a numbered proposal and a draft with no customer name. */
export function SearchProposalsAsDrawn({ reader = 'en' }: { reader?: Reader }) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  return (
    <Frame act={act} reader={reader}>
      <SearchResults
        read={FOUND}
        searching={false}
        cursor={null}
        onOpen={setAct}
        onReopen={() => undefined}
        words={searchWords(t)}
      />
    </Frame>
  );
}
