'use client';
import type { ProposalFieldSetWire, UiLanguage } from '@heliogrid/contracts';
import { sameContent, UI_SOURCE_LOCALE } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { DataError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { useSession } from './use-session';

type Terms = ProposalFieldSetWire['terms'];

/** Step 9's *Save as default* (`M06-15`): the terms a proposal holds, made the company's template. */
export interface TermsDefault {
  save(terms: Terms): void;
  readonly saving: boolean;
  /** The terms the last save stored, or found already stored; `null` before one landed. */
  readonly saved: Terms | null;
  readonly failure: DataError | null;
}

/**
 * Writes the template whole with the terms in it, then holds the answer where Proposal defaults
 * reads it (its read never goes stale on its own, and its whole-record Save would send the old
 * terms back) and lets the copies held in other languages go. The server keeps terms equal to the
 * platform's in the SAVER's language as the platform's; the platform's words in any other language
 * would be stored as the company's own — so terms the template already gives in the proposal's
 * language are not sent at all.
 */
export function useTermsDefault(proposalReader: UiLanguage): TermsDefault {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const saver = user?.interfaceLanguage ?? UI_SOURCE_LOCALE;
  const [saved, setSaved] = useState<Terms | null>(null);
  const templateIn = (reader: UiLanguage) =>
    queryClient.fetchQuery({
      queryKey: queryKeys.settings.proposalTemplate(tenantId, reader),
      queryFn: ({ signal }) => repositories.settings.proposalTemplate(reader, signal),
    });

  const action = useAction(
    async (terms: Terms) => {
      const [held, shown] = await Promise.all([templateIn(saver), templateIn(proposalReader)]);
      if (sameContent(terms, shown.defaultTerms)) return;
      const { changed: _changed, coverPhotoUrl: _photo, ...template } = held;
      const answer = await repositories.settings.saveProposalTemplate({
        ...template,
        defaultTerms: terms,
      });
      const every = queryKeys.settings.proposalTemplates(tenantId);
      queryClient.setQueryData(queryKeys.settings.proposalTemplate(tenantId, saver), answer);
      queryClient.removeQueries({
        queryKey: every,
        predicate: (query) => query.queryKey[every.length] !== saver,
      });
    },
    { onDone: (_answer, terms) => setSaved(terms) },
  );

  return {
    save: (terms) => {
      setSaved(null);
      void action.run(terms);
    },
    saving: action.pending,
    saved,
    failure: action.failure === null ? null : (action.failure as DataError),
  };
}
