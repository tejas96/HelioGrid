import {
  formatMoneyPlainly,
  formatNumber,
  IN_FORMATS,
  type ProposalEntryFilter,
} from '@heliogrid/domain';
import {
  createTranslator,
  newLinkWords,
  pickLeadWords,
  proposalLinksWords,
  proposalListWords,
  proposalTrackWords,
  proposalVersionsWords,
  provenanceWords,
  putInForceWords,
} from '@heliogrid/i18n';
import {
  NewLinkSheet,
  PickLeadSheet,
  ProposalLinks,
  ProposalList,
  ProposalTrack,
  ProposalVersions,
  ProvenanceWordsProvider,
  PutInForceSheet,
} from '@heliogrid/ui';
import { useRef, useState } from 'react';
import { ENTRIES } from '../support/proposal-after-lists';
import {
  detailAt,
  IN_FORCE,
  LATEST_VERSION,
  LINKS,
  type TrackStanding,
  VERSIONS,
} from '../support/proposal-after-sample';

export const READERS = { en: await createTranslator('en'), hi: await createTranslator('hi') };
export type Reader = keyof typeof READERS;

/** The tenant's formats as a screen's hook holds them: India's money, and a fixed clock for a moment. */
export const FORMATS = {
  money: (amount: string) => formatMoneyPlainly(IN_FORMATS, amount),
  number: (value: number) => formatNumber(IN_FORMATS, value),
  when: (instant: string) => `${instant.slice(8, 10)} Nov, ${instant.slice(11, 16)}`,
  ago: () => '2 hours ago',
  due: (stage: string) => stage,
  day: () => '14 Nov 2026',
};

/** What a story reports back to its spec: the last act, as an attribute on its frame. */
export function Frame({
  act,
  reader,
  children,
}: {
  act: string;
  reader: Reader;
  children: React.ReactNode;
}) {
  return (
    <ProvenanceWordsProvider value={provenanceWords(READERS[reader].t)}>
      <div lang={reader} data-act={act} style={{ padding: 16 }}>
        {children}
      </div>
    </ProvenanceWordsProvider>
  );
}

/** The sample as a draft: no number, no version, nothing generated. */
function draftOr(draft: boolean, detail: ReturnType<typeof detailAt>): ReturnType<typeof detailAt> {
  if (!draft) return detail;
  return {
    ...detail,
    standing: 'draft',
    progress: { complete: 4, of: 11 },
    tracking: { ...detail.tracking, generatedAt: null },
  };
}

export function TrackAsDrawn({
  standing,
  frame = 'ready',
  reader = 'en',
  crew = false,
  blockedBy = null,
  draft = false,
}: {
  standing: TrackStanding;
  frame?: 'ready' | 'loading' | 'failed';
  reader?: Reader;
  crew?: boolean;
  /** Why sharing is refused, as the server names it (`shareBlockedBy`). */
  blockedBy?: string | null;
  /** A draft: never generated, so no step has happened. */
  draft?: boolean;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const focus = useRef<HTMLDivElement>(null);
  const read =
    frame === 'loading'
      ? ({ kind: 'loading' } as const)
      : frame === 'failed'
        ? ({ kind: 'failed', failure: 'refused', retry: () => setAct('retry') } as const)
        : ({
            kind: 'ready',
            value: draftOr(draft, { ...detailAt(standing), shareBlockedBy: blockedBy }),
          } as const);
  return (
    <Frame act={act} reader={reader}>
      <div ref={focus} tabIndex={-1}>
        <ProposalTrack
          read={read}
          words={proposalTrackWords(t, FORMATS)}
          shown={null}
          crewMessageDue={crew}
          pending={null}
          failure={null}
          onAct={setAct}
          onOpenDocument={() => setAct('document')}
          onOpenVersions={() => setAct('versions')}
          onOpenLinks={() => setAct('links')}
          onOpenFollowUp={() => setAct('follow_up')}
          onThank={() => setAct('thank')}
          onCrewMessage={() => setAct('crew')}
          focusAfter={focus}
        />
      </div>
    </Frame>
  );
}

export function VersionsAsDrawn({
  won = false,
  reader = 'en',
}: {
  won?: boolean;
  reader?: Reader;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const focus = useRef<HTMLDivElement>(null);
  return (
    <Frame act={act} reader={reader}>
      <div ref={focus} tabIndex={-1}>
        <ProposalVersions
          read={{ kind: 'ready', value: { versions: VERSIONS, latest: LATEST_VERSION } }}
          words={proposalVersionsWords(t, FORMATS)}
          won={won}
          mayShare
          mayPutInForce
          onShare={(version) => setAct(`share:${version}`)}
          onView={(version) => setAct(`view:${version}`)}
          onPutInForce={(version) => setAct(`force:${version}`)}
          focusAfter={focus}
        />
        <PutInForceSheet
          open={act === 'force:2'}
          onClose={() => setAct('closed')}
          words={putInForceWords(t, FORMATS, {
            version: 2,
            customerName: 'Anil',
            segment: 'residential',
          })}
          preview={{ kind: 'ready', value: IN_FORCE }}
          sending={false}
          failure={null}
          onConfirm={() => setAct('confirmed')}
        />
      </div>
    </Frame>
  );
}

export function LinksAsDrawn({ reader = 'en' }: { reader?: Reader }) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [revoked, setRevoked] = useState<string | null>(null);
  const [draft, setDraft] = useState({ contactId: null as string | null, label: '' });
  const focus = useRef<HTMLDivElement>(null);
  /* As the app draws it once Turn off lands: that link is off, and its acts are gone. */
  const links = LINKS.links.map((link) =>
    link.id === revoked ? { ...link, status: 'revoked' as const } : link,
  );
  return (
    <Frame act={act} reader={reader}>
      <div ref={focus} tabIndex={-1} data-testid="links-page">
        <ProposalLinks
          read={{ kind: 'ready', value: { ...LINKS, links } }}
          words={proposalLinksWords(t, FORMATS)}
          pending={null}
          failure={null}
          confirming={confirming}
          onCopy={(id) => setAct(`copy:${id.slice(-2)}`)}
          onRemint={(id) => setAct(`remint:${id.slice(-2)}`)}
          onAskRevoke={setConfirming}
          onRevoke={(id) => {
            setAct(`revoke:${id.slice(-2)}`);
            setRevoked(id);
            setConfirming(null);
          }}
          onCancelRevoke={() => setConfirming(null)}
          focusAfter={focus}
        />
        <NewLinkSheet
          open={act === 'new'}
          onClose={() => setAct('closed')}
          words={newLinkWords(t)}
          contacts={LINKS.contacts}
          draft={draft}
          onChange={setDraft}
          sending={false}
          failure={null}
          onMake={(made) => setAct(`made:${made.label}`)}
        />
        <button type="button" onClick={() => setAct('new')}>
          open-new-link
        </button>
      </div>
    </Frame>
  );
}

export function ListAsDrawn({
  room,
  frame = 'ready',
  reader = 'en',
  stale = false,
}: {
  room: 'wide' | 'narrow';
  frame?: 'ready' | 'loading' | 'empty';
  reader?: Reader;
  /** The first row is not current. */
  stale?: boolean;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const [filter, setFilter] = useState<ProposalEntryFilter>('all');
  const [query, setQuery] = useState('');
  const focus = useRef<HTMLDivElement>(null);
  const [design, first, ...rest] = ENTRIES.rows.items;
  const items =
    stale && first !== undefined && design !== undefined
      ? [design, { ...first, stale: true }, ...rest]
      : ENTRIES.rows.items;
  const shown = filter === '3d' ? items.filter((row) => row.kind === 'design') : items;
  const value =
    frame === 'empty'
      ? { ...ENTRIES, rows: { items: [], totalCount: 0 } }
      : { ...ENTRIES, rows: { items: shown, totalCount: shown.length } };
  return (
    <Frame act={act} reader={reader}>
      <div ref={focus} tabIndex={-1} data-filter={filter}>
        <ProposalList
          read={frame === 'loading' ? { kind: 'loading' } : { kind: 'ready', value }}
          room={room}
          filter={filter}
          onFilter={setFilter}
          words={proposalListWords(t, FORMATS, null)}
          onOpen={(row) =>
            setAct(row.kind === 'design' ? `design:${row.id}` : `open:${row.number ?? 'draft'}`)
          }
          onCopy={(row) => setAct(`copy:${row.number ?? 'draft'}`)}
          onNewVersion={(row) => setAct(`new:${row.number ?? 'draft'}`)}
          focusAfter={focus}
        />
        <PickLeadSheet
          open={act.startsWith('copy:')}
          onClose={() => setAct('closed')}
          words={pickLeadWords(t)}
          query={query}
          onQuery={setQuery}
          leads={{
            kind: 'ready',
            value: [
              { id: 'l1', name: 'Meena Deshpande', line: 'Kothrud, Pune · 5 kW' },
              { id: 'l2', name: 'Rohan Kale', line: 'Baner, Pune' },
            ],
          }}
          pendingId={null}
          failure={null}
          onPick={(id) => setAct(`picked:${id}`)}
          onNewCustomer={() => setAct('new-customer')}
          focusAfter={focus}
        />
      </div>
    </Frame>
  );
}
