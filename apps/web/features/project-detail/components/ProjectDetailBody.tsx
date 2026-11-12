'use client';
import type { ProjectScreen, ProjectShown } from '@heliogrid/data/react';
import {
  moneyCardWords,
  type ProjectDetailCopy,
  projectPackWords,
  projectSheetWords,
  projectToastWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type FocusHandle,
  MoneyCard,
  ProjectActSheet,
  ProjectDetail,
  type ProjectPageRoute,
  projectBodyOf,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { ProjectToast } from '../../../lib/project-toast';
import type { ProjectMoves } from '../hooks/use-project-moves';

/**
 * The project once read: the page (`ProjectDetail`, the phone's too), the one sheet an act opens,
 * and the toast an act leaves. A refusal is said where the person acted — in the open sheet, else
 * on the page; a move another person made first names them. Once an act that leaves has gone —
 * *Wait is over*, the toast's *Undo* — focus lands on the hero's act.
 */
export function ProjectDetailBody({
  screen,
  shown,
  words,
  route,
  moves,
}: {
  screen: ProjectScreen;
  shown: ProjectShown;
  words: ProjectDetailCopy;
  route: Pick<ProjectPageRoute, 'documents'>;
  moves: ProjectMoves;
}) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const word = projectPackWords(format.pack, locale);
  const hero = useRef<FocusHandle>(null);
  const said = words.said(screen.refusal, screen.failed, screen.lastMove ?? undefined);
  const { page: detail, sheet } = projectBodyOf(screen, shown, route, moves, said, hero);
  const money = shown.project.money ?? null;
  return (
    <>
      <ProjectDetail
        {...detail}
        money={
          money === null ? null : (
            <MoneyCard
              money={money}
              today={shown.project.today}
              words={moneyCardWords(t)}
              onShare={moves.payments}
              onOpen={() => moves.payments()}
            />
          )
        }
        words={words}
      />
      <ProjectActSheet {...sheet} words={projectSheetWords(t, word, format.date)} />
      <ProjectToast
        screen={screen}
        words={projectToastWords(t, word, format.date)}
        focusAfter={hero}
      />
    </>
  );
}
