'use client';
import type { MyDay, MyDayItem } from '@heliogrid/contracts';
import {
  type CallOutcome,
  MY_DAY_BANDS,
  type MyDayBand,
  movedToTomorrow,
  type Read,
  showsMyDay,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useShell } from './use-shell';
import { useTenantId } from './use-tenant-id';

/** How many rows a band shows before its *Show more*. */
export const MY_DAY_SHOWN = 3;

/** One band as it is drawn: its rows so far, the whole count, and how many wait behind. */
export interface MyDayBandView {
  readonly band: MyDayBand;
  readonly count: number;
  readonly rows: readonly MyDayItem[];
  readonly hidden: number;
}

/** An act *Undo* can take back: a tick or a move. */
export type MyDayUndoable =
  | { readonly kind: 'done'; readonly item: MyDayItem }
  | { readonly kind: 'moved'; readonly item: MyDayItem; readonly to: number };

/**
 * The last act on a task, for its toast: a tick or a move, with *Undo*; or a call's answer logged,
 * which is the lead's record and has none.
 */
export type MyDayAct =
  | MyDayUndoable
  | { readonly kind: 'called'; readonly item: MyDayItem; readonly outcome: CallOutcome };

export interface MyDayScreen {
  /** Whether this home holds My Day: the sales executive's, or composed into a higher home. */
  readonly shown: boolean;
  readonly read: Exclude<Read<MyDay>, { readonly kind: 'empty' }>;
  /** The day in counts for the line under the greeting — null until the day is read. */
  readonly counts: MyDay['counts'] | null;
  /** The one thing to do now (`nextUpOf`), drawn as the hero; absent from its band below. */
  readonly next: MyDayItem | null;
  /** Overdue, today and this week, in that order; a band with nothing in it is left out. */
  readonly bands: readonly MyDayBandView[];
  expand(band: MyDayBand): void;
  /** Ticks a task done at once; *Undo* reopens it. */
  done(item: MyDayItem): void;
  /** Moves an open task to the same time tomorrow on the company's clock. */
  moveToTomorrow(item: MyDayItem): void;
  /** The task whose call was just placed, asking how it went — null when none asks. */
  readonly asking: MyDayItem | null;
  /** The person tapped Call: the card asks how it went when they come back. */
  called(item: MyDayItem): void;
  /** How the call went: logged on the lead, and the task is done — a no-answer raises its retry. */
  answer(outcome: CallOutcome): void;
  /** The card's ask closed without an answer. */
  skipAnswer(): void;
  readonly sending: boolean;
  /** The last act, for its toast — with *Undo* where it has one; null once dismissed. */
  readonly lastAct: MyDayAct | null;
  undo(): void;
  dismissAct(): void;
  /** A tick, a move or an answer that did not land, said where the person acted. */
  readonly failed: boolean;
}

/** The items of one band, the next-up task left out because the hero holds it. */
function bandItems(day: MyDay, band: MyDayBand): readonly MyDayItem[] {
  return day.items.filter((item) => item.band === band && item.task.id !== day.nextTaskId);
}

/**
 * My Day (`SCR-M07-01`, `M07-01`…`M07-06`): the one task to do now in the hero, then overdue,
 * today and this week, each its first few until *Show more*. Ticking, moving and answering a call
 * land at once and refresh every CRM read; a home without My Day reads nothing.
 */
export function useMyDay(): MyDayScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const shown = showsMyDay(useShell().home);
  const [open, setOpen] = useState<ReadonlySet<MyDayBand>>(new Set());
  const [asking, setAsking] = useState<MyDayItem | null>(null);
  /*
   * The call's answer, once logged, is the lead's record: a retry after the task's tick failed sends
   * only the tick. The moment is held from the first press, so a retried send of the log keeps its
   * retry key — two presses never log two calls.
   */
  const logged = useRef<{ readonly taskId: string; readonly at: string; done: boolean } | null>(
    null,
  );
  const [lastAct, setLastAct] = useState<MyDayAct | null>(null);
  const query = useQuery({
    queryKey: queryKeys.crm.myDay(tenantId),
    queryFn: ({ signal }) => repositories.myDay.read(signal),
    enabled: shown && tenantId !== '',
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.crm.all(tenantId) });
  const capturedAt = () => new Date().toISOString();

  const act = useAction(
    async (input: MyDayUndoable | { readonly kind: 'undo'; readonly act: MyDayUndoable }) => {
      const { tasks } = repositories;
      if (input.kind === 'done')
        return tasks.done(input.item.task.id, { capturedAt: capturedAt() });
      if (input.kind === 'moved') {
        return tasks.move(input.item.task.id, {
          dueAt: new Date(input.to).toISOString(),
          capturedAt: capturedAt(),
        });
      }
      const undone = input.act;
      return undone.kind === 'done'
        ? tasks.reopen(undone.item.task.id, { capturedAt: capturedAt() })
        : tasks.move(undone.item.task.id, {
            dueAt: undone.item.task.dueAt,
            capturedAt: capturedAt(),
          });
    },
    {
      onDone: (_task, input) => {
        setLastAct(input.kind === 'undo' ? null : input);
        void refresh();
      },
    },
  );
  const call = useAction(
    async ({ item, outcome }: { readonly item: MyDayItem; readonly outcome: CallOutcome }) => {
      if (logged.current?.taskId !== item.task.id) {
        logged.current = { taskId: item.task.id, at: capturedAt(), done: false };
      }
      const answer = logged.current;
      if (!answer.done) {
        await repositories.leadCalls.logCall(item.lead.id, { outcome, capturedAt: answer.at });
        answer.done = true;
      }
      return repositories.tasks.done(item.task.id, { capturedAt: answer.at });
    },
    {
      onDone: (_task, { item, outcome }) => {
        logged.current = null;
        setAsking(null);
        setLastAct({ kind: 'called', item, outcome });
        void refresh();
      },
    },
  );

  const day = query.data;
  const bands =
    day === undefined
      ? []
      : MY_DAY_BANDS.flatMap((band): MyDayBandView[] => {
          const items = bandItems(day, band);
          const count = items.length;
          if (count === 0) return [];
          const rows = open.has(band) ? items : items.slice(0, MY_DAY_SHOWN);
          return [{ band, count, rows, hidden: count - rows.length }];
        });
  const next = day?.items.find((item) => item.task.id === day.nextTaskId) ?? null;
  const send = (input: MyDayUndoable | { readonly kind: 'undo'; readonly act: MyDayUndoable }) => {
    if (act.isOut() || call.isOut()) return;
    void act.run(input);
  };

  return {
    shown,
    read: recordReadOf(query),
    counts: shown && day !== undefined ? day.counts : null,
    next,
    bands,
    expand: (band) => setOpen((was) => new Set([...was, band])),
    done: (item) => send({ kind: 'done', item }),
    moveToTomorrow: (item) => {
      if (day === undefined) return;
      const to = movedToTomorrow(Date.parse(item.task.dueAt), Date.now(), day.timeZone);
      send({ kind: 'moved', item, to });
    },
    asking,
    called: (item) => {
      logged.current = null;
      setAsking(item);
    },
    answer: (outcome) => {
      if (asking === null || act.isOut() || call.isOut()) return;
      void call.run({ item: asking, outcome });
    },
    skipAnswer: () => {
      if (!call.isOut()) setAsking(null);
    },
    sending: act.pending || call.pending,
    lastAct,
    undo: () => {
      if (lastAct !== null && lastAct.kind !== 'called') send({ kind: 'undo', act: lastAct });
    },
    dismissAct: () => setLastAct(null),
    failed: act.failure !== null || call.failure !== null,
  };
}
