'use client';
import type { SearchResults } from '@heliogrid/contracts';
import {
  can,
  type FormatPack,
  type LeadActFailure,
  offersDoor,
  opensSettingsRow,
  SEARCH_SETTLE_MS,
  type SearchRead,
  type SearchReopenAct,
  searchFoundNothing,
  searchViewOf,
  shellViewFor,
} from '@heliogrid/domain';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { leadActFailureOf } from './lead-detail-cache';
import { readOf } from './read';
import { useSession } from './use-session';
import { useSettled } from './use-settled';

/**
 * Global Search (`SCR-SHELL-02`, `F6-20`, `F6-23`) as every surface draws it — the web's palette
 * and page and the phone's screen — assembled once (Law 11): what is typed, the answer for it as
 * drawn, and a junk lead's Reopen, out in its row until the server confirms.
 */
export interface SearchScreen {
  /** What is typed, as typed. */
  readonly query: string;
  type(query: string): void;
  clear(): void;
  /** Nothing typed: the hint; then the answer for the query, or its wait, failure or nothing. */
  readonly read: SearchRead<LeadActFailure>;
  /** The answer drawn is to an earlier query: the one for what is typed now is on its way. */
  readonly searching: boolean;
  /** Reopens a junk lead from its row; a second press while one is out sends nothing. */
  reopen(leadId: string): void;
  /** The row the keyboard's cursor is on — the first of a new answer; null with no rows. */
  readonly cursor: string | null;
  /** What Enter opens: the cursor's row's record, or null when that row opens nothing. */
  readonly cursorAddress: string | null;
  /** ↓ or ↑: the cursor moves one row, stopping at either end. */
  step(by: 1 | -1): void;
}

/** One answer and the query it is for, so an answer kept while the next is out names its own. */
interface Answer {
  readonly asked: string;
  readonly results: SearchResults;
}

export function useSearchScreen({ pack }: { readonly pack: FormatPack }): SearchScreen {
  const { user, chosenHome } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const [query, setQuery] = useState('');
  const typed = query.trim();
  const asked = useSettled(typed, SEARCH_SETTLE_MS);
  const answer = useQuery({
    queryKey: queryKeys.search(tenantId, { q: asked }),
    queryFn: async ({ signal }): Promise<Answer> => ({
      asked,
      results: await repositories.search.search({ q: asked }, signal),
    }),
    enabled: tenantId !== '' && asked !== '',
    placeholderData: keepPreviousData,
  });
  const [cursorAt, setCursorAt] = useState({ order: '', at: 0 });
  const [reopens, setReopens] = useState<ReadonlyMap<string, SearchReopenAct<LeadActFailure>>>(
    new Map(),
  );
  const standing = (leadId: string, act: SearchReopenAct<LeadActFailure> | null) =>
    setReopens((now) => {
      const next = new Map(now);
      if (act === null) next.delete(leadId);
      else next.set(leadId, act);
      return next;
    });
  const reopening = useAction(
    (leadId: string) =>
      repositories.leadLifecycle.reopen(leadId, { capturedAt: new Date().toISOString() }),
    {
      key: (leadId) => leadId,
      onDone: (detail, leadId) => {
        standing(leadId, { kind: 'reopened', stage: detail.lead.stage, state: detail.lead.state });
        // The lead is back in the queues and lists, and every kept answer now holds it open.
        void queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.search(tenantId) });
      },
      // The billing gate's refusal is told once, by the app's denial: the row is as it was.
      onFailed: (error, leadId) =>
        standing(
          leadId,
          billingRefused(error) ? null : { kind: 'returned', failure: leadActFailureOf(error) },
        ),
    },
  );

  const drawn = (kept: Answer): SearchRead<LeadActFailure> => {
    if (searchFoundNothing(kept.results)) return { kind: 'empty', asked: kept.asked };
    const shell = shellViewFor(roles, chosenHome);
    const view = searchViewOf(kept.results, {
      pack,
      asked: kept.asked,
      readerId: user?.id ?? null,
      opens: {
        leadsList: offersDoor(shell, 'leads'),
        team: opensSettingsRow(roles, 'team'),
        catalog: opensSettingsRow(roles, 'catalog'),
      },
      canReopen: can(roles, 'crm.lead_state_changes'),
      reopens,
    });
    return { kind: 'ready', value: view };
  };
  /* `readOf` keeps an answer drawn when a later read of it fails; with none, the failure shows. */
  const answered = readOf(answer);
  const shown = answered.kind === 'ready' ? shownAnswer(answered.value, typed) : null;
  const searchRead = (): SearchRead<LeadActFailure> => {
    if (typed === '') return { kind: 'idle' };
    if (shown !== null) return drawn(shown);
    return answered.kind === 'failed' ? answered : { kind: 'loading' };
  };

  const read = searchRead();
  const rows = read.kind === 'ready' ? read.value.groups.flatMap((group) => group.rows) : [];
  /* The cursor belongs to the rows it was moved over: a new answer starts it at its first row. */
  const order = rows.map((row) => row.key).join(' ');
  const at = cursorAt.order === order ? Math.min(cursorAt.at, rows.length - 1) : 0;
  const cursorRow = rows[at] ?? null;

  return {
    query,
    type: setQuery,
    clear: () => setQuery(''),
    read,
    searching: shown !== null && shown.asked !== typed,
    reopen: (leadId) => {
      if (reopening.isOut(leadId)) return;
      standing(leadId, { kind: 'waiting' });
      void reopening.run(leadId);
    },
    cursor: cursorRow?.key ?? null,
    cursorAddress: cursorRow?.address ?? null,
    step: (by) => setCursorAt({ order, at: Math.max(0, Math.min(at + by, rows.length - 1)) }),
  };
}

/**
 * The answer worth drawing for what is typed: its own, or one to an earlier query while the next is
 * out — only while the person refines the same words or number, so an answer to something
 * unrelated never stands under a new query.
 */
function shownAnswer(answer: Answer, typed: string): Answer | null {
  const before = answer.asked.toLowerCase();
  const now = typed.toLowerCase();
  return now.startsWith(before) || before.startsWith(now) ? answer : null;
}

function billingRefused(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'ENTITLEMENT_BLOCKED';
}
