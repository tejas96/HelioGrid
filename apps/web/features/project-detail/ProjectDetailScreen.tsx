'use client';
import { type ProjectShown, useProjectScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  projectDetailWords,
  projectPackWords,
  projectTitleWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  LargeTitle,
  PROJECT_WIDE_FROM,
  ProjectDetailStates,
  ProjectFacts,
  ProjectHeadActs,
  type ProjectPageRoute,
  projectHeadActsOf,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { ProjectDetailBody } from './components/ProjectDetailBody';
import { ProjectTrail } from './components/ProjectTrail';
import { useProjectMoves } from './hooks/use-project-moves';

import './project-detail.css';

/**
 * One project on the web (`SCR-M08-02`), or its whole checklist (`SCR-M08-03`): the project
 * manager or the owner at a desk — they came to see where the job stands and move it on, upload a
 * paper or record a wait, and could be frustrated by a crowded page or an act they cannot find. The
 * way back, the title with its facts and its acts, then the project. What is read and sent is
 * `useProjectScreen`'s, the phone's too; the web's own parts are the router, the file chooser, the
 * new tab a file opens in, the dialler and the clipboard.
 */
export function ProjectDetailScreen({ projectId, documents, ask }: ProjectPageRoute) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectScreen(projectId, ask);
  const moves = useProjectMoves(projectId, screen);
  const words = projectDetailWords(t, projectPackWords(format.pack, locale), format.date);
  /* One breakpoint with the page body: below it the acts ride the way-back row, as the phone's bar. */
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROJECT_WIDE_FROM;
  const { read } = screen;
  const shown = read.kind === 'ready' ? read.value : null;
  const heading =
    shown === null
      ? null
      : projectTitleWords(t, {
          name: shown.project.customer.name,
          number: shown.project.number,
          place: shown.project.customer.city,
        });
  /* The acts: the wide head's words, or round icons in the way-back row, as the phone's bar. */
  const acts = (form: 'header' | 'bar') =>
    shown === null || documents === 'all' ? null : (
      <ProjectHeadActs
        form={form}
        project={shown.project}
        view={shown.view}
        words={words}
        {...projectHeadActsOf(screen, moves)}
      />
    );
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-project-page">
      <ProjectTrail
        acts={wide ? null : acts('bar')}
        board={destinationLabel(t, moves.wayBack)}
        project={heading?.title ?? null}
        documents={documents === 'all' ? words.documents : null}
        onBoard={moves.toWayBack}
        onProject={moves.toProject}
      />
      {shown === null || heading === null ? null : (
        <ProjectPageHead
          shown={shown}
          heading={heading}
          documents={documents}
          words={words}
          acts={wide ? acts('header') : null}
        />
      )}
      {read.kind === 'ready' ? (
        <ProjectDetailBody
          screen={screen}
          shown={read.value}
          words={words}
          route={{ documents }}
          moves={moves}
        />
      ) : (
        <ProjectDetailStates read={read} words={words} focusAfter={room} />
      )}
    </div>
  );
}

/** The page's title row: the title and its line, the facts under them, and the wide head's acts. */
function ProjectPageHead({
  shown,
  heading,
  documents,
  words,
  acts,
}: {
  shown: ProjectShown;
  heading: ReturnType<typeof projectTitleWords>;
  documents: ProjectPageRoute['documents'];
  words: ReturnType<typeof projectDetailWords>;
  acts: ReactNode;
}) {
  const all = documents === 'all';
  return (
    <div className="hg-project-page-head">
      <div className="hg-project-page-title">
        <LargeTitle
          title={all ? words.documents : heading.title}
          summary={
            all
              ? words.docsSummary(
                  heading.title,
                  shown.view.documentsDone,
                  shown.view.documentsTotal,
                )
              : heading.summary
          }
        />
        {all ? null : <ProjectFacts project={shown.project} words={words} />}
      </div>
      {acts}
    </div>
  );
}
