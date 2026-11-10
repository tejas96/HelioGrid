'use client';
import type { LeadDetail } from '@heliogrid/contracts';
import {
  type LeadActFailure,
  type QualifyQuestion,
  type QualifySaves,
  qualifyEditOf,
} from '@heliogrid/domain';
import { useRef, useState } from 'react';
import { useAction } from './action';
import { useRepositories } from './context';
import { leadActFailureOf, useLeadDetailCache } from './lead-detail-cache';

/**
 * The qualify card's saves (`M02-39`): each answer is its own edit, sent the moment it is given.
 * An answer given while that question's last one is still out waits and goes after it, so the
 * later answer is the one that stands; a failed answer says so at its question and the others stay.
 */
export interface LeadQualify {
  readonly saves: QualifySaves;
  /** The answer that landed last — its *Saved* mark shows. */
  readonly lastSaved: QualifyQuestion | null;
  /** A chip tapped or the bill committed; `null` empties the bill. A value not listed sends nothing. */
  answer(question: QualifyQuestion, value: string | null): void;
  /** Sends the answer that came back unsaved at that question again. */
  retry(question: QualifyQuestion): void;
  /** Mark qualified (`M02-45`): a person decides; the answers only inform. */
  readonly markQualified: {
    run(): void;
    readonly pending: boolean;
    readonly failure: LeadActFailure | null;
  };
}

interface QualifyAnswer {
  readonly question: QualifyQuestion;
  readonly value: string | null;
}

export function useLeadQualify(leadId: string, saved: LeadDetail | null): LeadQualify {
  const repositories = useRepositories();
  const cache = useLeadDetailCache(leadId);
  const [saves, setSaves] = useState<QualifySaves>({});
  const [lastSaved, setLastSaved] = useState<QualifyQuestion | null>(null);
  /* The answer given while its question's last one was out, sent once that one answers. */
  const waiting = useRef(new Map<QualifyQuestion, string | null>());

  const edit = useAction(
    ({ question, value }: QualifyAnswer) =>
      repositories.leadEdits.edit(leadId, {
        ...qualifyEditOf(question, value),
        capturedAt: new Date().toISOString(),
      }),
    {
      key: ({ question }) => question,
      onDone: (answer, { question }) => cache.edited(answer, [question]),
    },
  );
  const mark = useAction(
    () =>
      repositories.leadLifecycle.markQualified(leadId, { capturedAt: new Date().toISOString() }),
    { onDone: cache.landed },
  );

  const saveOf = (question: QualifyQuestion, save: QualifySaves[QualifyQuestion] | null) =>
    setSaves((was) => {
      const next = { ...was };
      if (save === null) delete next[question];
      else next[question] = save;
      return next;
    });

  const send = async (question: QualifyQuestion, value: string | null): Promise<void> => {
    saveOf(question, { value, status: 'saving' });
    const answered = await edit.run({ question, value });
    if (answered.kind === 'out') {
      waiting.current.set(question, value);
      return;
    }
    if (waiting.current.has(question)) {
      const later = waiting.current.get(question) ?? null;
      waiting.current.delete(question);
      await send(question, later);
      return;
    }
    if (answered.kind === 'done') {
      saveOf(question, null);
      setLastSaved(question);
    } else saveOf(question, { value, status: 'failed' });
  };

  const recorded = (question: QualifyQuestion): string | null =>
    saved === null
      ? null
      : question === 'monthlyBill'
        ? (saved.lead.monthlyBill?.amount ?? null)
        : saved.qualify[question];

  return {
    saves,
    lastSaved,
    answer: (question, value) => {
      if (qualifyEditOf(question, value) === null) return;
      const out = saves[question];
      const unchanged = out === undefined ? recorded(question) === value : out.value === value;
      if (unchanged && out?.status !== 'failed') return;
      void send(question, value);
    },
    retry: (question) => {
      const failed = saves[question];
      if (failed?.status === 'failed') void send(question, failed.value);
    },
    markQualified: {
      run: () => void mark.run(undefined),
      pending: mark.pending,
      failure: mark.failure === null ? null : leadActFailureOf(mark.failure),
    },
  };
}
