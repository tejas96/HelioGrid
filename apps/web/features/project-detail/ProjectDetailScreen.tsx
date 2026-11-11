'use client';
import { useProjectScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  projectDetailWords,
  projectPackWords,
  projectTitleWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  LargeTitle,
  ProjectDetailStates,
  ProjectFacts,
  ProjectHeadActs,
  type ProjectPageRoute,
  projectHeadActsOf,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
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
  const room = useRef<HTMLDivElement>(null);
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
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-project-page">
      <ProjectTrail
        board={destinationLabel(t, moves.wayBack)}
        project={heading?.title ?? null}
        documents={documents === 'all' ? words.documents : null}
        onBoard={moves.toWayBack}
        onProject={moves.toProject}
      />
      {shown === null || heading === null ? null : (
        <div className="hg-project-page-head">
          <div className="hg-project-page-title">
            <LargeTitle
              title={documents === 'all' ? words.documents : heading.title}
              summary={
                documents === 'all'
                  ? words.docsSummary(
                      heading.title,
                      shown.view.documentsDone,
                      shown.view.documentsTotal,
                    )
                  : heading.summary
              }
            />
            {documents === 'all' ? null : <ProjectFacts project={shown.project} words={words} />}
          </div>
          {documents === 'all' ? null : (
            <ProjectHeadActs
              project={shown.project}
              view={shown.view}
              words={words}
              {...projectHeadActsOf(screen, moves)}
            />
          )}
        </div>
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
