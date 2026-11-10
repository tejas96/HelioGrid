'use client';
import {
  type LeadsListScreen as LeadsListScreenView,
  useLeadsListScreen,
} from '@heliogrid/data/react';
import { leadsListWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { LargeTitle, LeadsList, LeadsListFilterBar, useFormat, useOwnWidth } from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { LEAD_IMPORT_PATH, LEAD_INBOX_PATH, leadPath } from '../lead-inbox';
import { DOOR_PATH } from '../shell';
import { LeadsListActs } from './components/LeadsListActs';
import { LeadsTable } from './components/LeadsTable';
import { LEADS_TABLE_FROM } from './constants';

import './leads-list.css';

/**
 * The Leads list on the web (`SCR-M02-03`): a rep between calls finds one lead fast, the owner
 * reads where each deal stands. Below the table's width the phone's page — the meter's card, the
 * chips, a card of rows; at it, the stages as one band over the table, its bill column sortable in
 * the tenant's currency (`M02-40`). What is read, filtered and counted is `useLeadsListScreen`'s,
 * the phone's too; the web's own parts are the width and the router. *Add lead* opens quick add
 * over this page; *Import* the file import; the Inbox segment the morning triage.
 */
export function LeadsListScreen() {
  const screen = useLeadsListScreen();
  if (!screen.allowed) notFound();
  return <LeadsListIn screen={screen} />;
}

function LeadsListIn({ screen }: { screen: LeadsListScreenView }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const router = useRouter();
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= LEADS_TABLE_FROM;
  const words = leadsListWords(t, { pack: format.pack, language: locale, now: Date.now() });
  const { read } = screen;
  const moves = {
    add: () => router.push(DOOR_PATH.add_lead),
    import: screen.canImport ? () => router.push(LEAD_IMPORT_PATH) : null,
    inbox: () => router.push(LEAD_INBOX_PATH),
    open: (leadId: string) => router.push(leadPath(leadId)),
  };
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-leads-list">
      <div className="hg-leads-list-head">
        <div className="hg-leads-list-title">
          <LargeTitle
            title={words.title}
            summary={
              read.kind === 'ready'
                ? words.summary({
                    open: read.value.pipeline.open,
                    waiting: screen.inboxWaiting,
                    matching: read.value.matching,
                    filtersOn: read.value.filtersOn,
                  })
                : read.kind === 'empty'
                  ? words.firstRunSummary
                  : undefined
            }
          />
        </div>
        <LeadsListActs words={words} onAdd={moves.add} onImport={moves.import} />
      </div>
      {read.kind === 'ready' ? (
        <LeadsListFilterBar
          screen={screen}
          pipeline={read.value.pipeline}
          form={wide ? 'band' : 'card'}
          words={words}
          onInbox={moves.inbox}
        />
      ) : null}
      <LeadsList
        read={read}
        words={words}
        refreshing={screen.refreshing}
        loadingMore={screen.loadingMore}
        onShowMore={screen.showMore}
        onClearFilters={screen.clearFilters}
        onAdd={moves.add}
        onImport={moves.import}
        onOpen={moves.open}
        focusAfter={room}
        table={
          wide && read.kind === 'ready' ? (
            <LeadsTable screen={screen} view={read.value} words={words} onOpen={moves.open} />
          ) : null
        }
      />
    </div>
  );
}
