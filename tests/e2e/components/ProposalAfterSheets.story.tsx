import type { ComposedMessage } from '@heliogrid/contracts';
import { basisPoints, type ProjectionAssumptions } from '@heliogrid/domain';
import {
  destinationLabel,
  leadProposalsWords,
  leadSectionsWords,
  markWonBasisWords,
  markWonWords,
  messageSheetWords,
  pickLeadWords,
  proposalPageHeadWords,
  proposalWithdrawWords,
  taxNumberNoticeWords,
} from '@heliogrid/i18n';
import {
  CustomerSurface,
  LeadSections,
  MarkWonSheet,
  type MarkWonSheetDraft,
  MessageSheet,
  PageTrail,
  ProposalWithdrawSheet,
  Provenance,
} from '@heliogrid/ui';
import { useRef, useState } from 'react';
import {
  LEAD_PROPOSALS,
  type LeadCase,
  SHARE_MESSAGE,
  WON_BASIS,
  type WonCase,
} from '../support/proposal-after-lists';
import { FORMATS, Frame, READERS, type Reader } from './ProposalAfter.story';

/** A 25-year saving that rides on a tariff rising 3% a year. */
const PROJECTION: ProjectionAssumptions = { horizonYears: 25, escalationRate: basisPoints(300) };

export function LeadProposalsAsDrawn({
  state,
  reader = 'en',
}: {
  state: LeadCase;
  reader?: Reader;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const [gone, setGone] = useState<string | null>(null);
  const page = useRef<HTMLDivElement>(null);
  const given = LEAD_PROPOSALS[state];
  /* As the app draws it once the withdraw lands: that proposal leaves the live ones with its act. */
  const section = { ...given, items: given.items.filter((each) => each.id !== gone) };
  const withdrawing = section.items.find((each) => act === `withdraw:${each.id}`) ?? null;
  const withdraw = withdrawing === null ? null : proposalWithdrawWords(t, FORMATS, withdrawing);
  const count = section.items.length;
  return (
    <Frame act={act} reader={reader}>
      <div ref={page} tabIndex={-1} data-testid="page" />
      <LeadSections
        section="proposals"
        onSection={() => undefined}
        counts={{ timeline: null, site: null, designs: 0, proposals: count, tasks: 0, files: 0 }}
        timeline={null}
        site={{ address: null, confirmed: false, facts: [] }}
        visit={null}
        tasks={[]}
        taskActs={{
          onDone: () => undefined,
          onReopen: () => undefined,
          onAddCallBack: () => undefined,
          pendingId: null,
          failure: null,
        }}
        files={{
          read: { kind: 'empty' },
          onAdd: null,
          pending: null,
          onRetry: () => undefined,
          onOpen: () => undefined,
        }}
        proposals={{
          section,
          closed: state === 'closed',
          words: leadProposalsWords(t, FORMATS, {
            customerName: 'Anil Sharma',
            segment: 'residential',
            closedAs: state === 'closed' ? 'lost' : null,
          }),
          onCreate: () => setAct('create'),
          onContinue: (id) => setAct(`continue:${id.slice(-2)}`),
          onOpen: (id) => setAct(`open:${id.slice(-2)}`),
          onWithdraw: (id) => setAct(`withdraw:${id}`),
          onReopenLead: () => setAct('reopen'),
          onOpenSibling: () => setAct('sibling'),
        }}
        words={leadSectionsWords(t)}
      />
      <ProposalWithdrawSheet
        open={withdraw !== null}
        onClose={() => setAct('closed')}
        close={pickLeadWords(t).close}
        words={withdraw?.words ?? null}
        sending={false}
        failure={null}
        onConfirm={() => {
          setGone(withdrawing?.id ?? null);
          setAct('withdrawn');
        }}
        focusAfter={page}
      />
    </Frame>
  );
}

export function MessageAsDrawn({
  kind,
  noTax = false,
  reader = 'en',
}: {
  kind: 'share' | 'thank' | 'crew';
  noTax?: boolean;
  reader?: Reader;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const notice = taxNumberNoticeWords(t, { taxName: 'GST', mayAdd: true, ownerName: null });
  const sent = (how: string) => (message: ComposedMessage) =>
    setAct(`${how}:${message.link ?? 'no-link'}`);
  return (
    <Frame act={act} reader={reader}>
      <MessageSheet
        open
        onClose={() => setAct('closed')}
        words={messageSheetWords(t, kind, {
          name: 'Anil',
          segment: 'residential',
          language: 'English',
          withoutTaxNumber: noTax,
        })}
        message={{ kind: 'ready', value: SHARE_MESSAGE }}
        notice={
          noTax
            ? {
                title: notice.title,
                line: notice.line,
                act: { label: notice.add, onPress: () => setAct('add-tax') },
              }
            : null
        }
        pending={null}
        failure={null}
        onShare={sent('share')}
        onCopy={sent('copy')}
        onPdf={() => setAct('pdf')}
      />
    </Frame>
  );
}

export function MarkWonAsDrawn({
  basis,
  reader = 'en',
  typedBefore = '',
}: {
  basis: WonCase;
  reader?: Reader;
  /** A value typed before the basis arrived and locked the field. */
  typedBefore?: string;
}) {
  const { t } = READERS[reader];
  const [act, setAct] = useState('');
  const wire = WON_BASIS[basis];
  /* As the app opens it: a locked value is never typed, so the draft's own value stays empty and
     the send carries the accepted version's (`useMarkWon`). */
  const [draft, setDraft] = useState<MarkWonSheetDraft>({
    finalValue: typedBefore,
    expectedInstallOn: '2026-11-20',
    managerId: 'm1',
  });
  return (
    <Frame act={act} reader={reader}>
      <MarkWonSheet
        open
        words={markWonWords(t, 'Anil Sharma')}
        today="2026-11-13"
        draft={draft}
        onChange={setDraft}
        managers={{
          kind: 'ready',
          value: [{ userId: 'm1', name: 'Priya Kulkarni', liveProjects: 2 }],
        }}
        sending={false}
        failure={null}
        started={null}
        onSend={(sent) => setAct(`sent:${wire.finalValue ?? sent.finalValue}`)}
        onClose={() => setAct('closed')}
        onOpenProject={() => setAct('project')}
        basis={markWonBasisWords(
          t,
          { ...FORMATS, due: (stage) => stage.replace(/_/g, ' ') },
          wire,
          { customerName: 'Anil Sharma', segment: 'residential', phone: '+91 98765 43210' },
        )}
      />
    </Frame>
  );
}

export function TrailAsDrawn({ narrow = false }: { narrow?: boolean }) {
  const [act, setAct] = useState('');
  const { t } = READERS.en;
  const head = proposalPageHeadWords(t, { money: String, number: String });
  return (
    <Frame act={act} reader="en">
      <PageTrail
        label={head.trail}
        here={head.versions}
        narrow={narrow}
        trail={[
          { label: destinationLabel(t, 'proposals'), onOpen: () => setAct('proposals') },
          { label: head.name('PRP-0042'), onOpen: () => setAct('detail') },
        ]}
      />
    </Frame>
  );
}

/** A projection's label: the word and each stated assumption, beside the tier (`T-FPLAT-074`). */
export function ProjectionAsDrawn({ reader = 'en' }: { reader?: Reader }) {
  return (
    <Frame act="" reader={reader}>
      <Provenance tier="estimated" projection={PROJECTION} />
    </Frame>
  );
}

/** A tenant's colour scope with one tinted tile in it, for the dark scheme's check (`T-F5-001`). */
export function TenantTintAsDrawn({ brand }: { brand: string }) {
  return (
    <CustomerSurface brandColor={brand}>
      <div
        data-testid="tint"
        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', padding: 16 }}
      >
        <a href="#top" style={{ color: 'var(--link)' }}>
          PRP-0042
        </a>
      </div>
    </CustomerSurface>
  );
}
