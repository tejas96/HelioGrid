'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { proposalPageHeadWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { PageTrail, useFormat } from '@heliogrid/ui';
import type { ReactNode } from 'react';

/**
 * The way back above a project's page, the app's one pattern (`PageTrail`): the board, then — on a
 * page under the project — the project, and where the person is now. Below the desktop's room it is
 * one back, with the page's Call and ⋯ at the row's other end, as the phone's bar holds them.
 */
export function ProjectTrail({
  acts,
  board,
  project,
  documents,
  narrow = false,
  onBoard,
  onProject,
}: {
  acts: ReactNode;
  board: TranslatedText;
  project: TranslatedText | null;
  /** The page under the project — its checklist, its steps, its payments — or `null` on the project. */
  documents: TranslatedText | null;
  narrow?: boolean;
  onBoard: () => void;
  onProject: () => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { trail } = proposalPageHeadWords(t, {
    money: (amount) => format.moneyPlain(amount),
    number: format.number,
  });
  const above =
    project === null || documents === null
      ? [{ label: board, onOpen: onBoard }]
      : [
          { label: board, onOpen: onBoard },
          { label: project, onOpen: onProject },
        ];
  return (
    <PageTrail
      trail={above}
      here={documents ?? project ?? board}
      label={trail}
      narrow={narrow}
      acts={acts}
    />
  );
}
