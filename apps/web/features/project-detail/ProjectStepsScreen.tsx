'use client';
import { useProjectScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  installerJobWords,
  projectDetailWords,
  projectPackWords,
  projectSheetWords,
  projectTitleWords,
  projectToastWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  LargeTitle,
  ProjectActSheet,
  ProjectDetailStates,
  ProjectInstallSteps,
  projectActFormOf,
  projectStepsActsOf,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { ProjectToast } from '../../lib/project-toast';
import { ProjectTrail } from './components/ProjectTrail';
import { useProjectMoves } from './hooks/use-project-moves';

import './project-detail.css';

/**
 * A project's install steps on the web (`SCR-M08-04`), opened from the hero's *Steps and photos*:
 * the manager checking the crew's progress, or a crew member at a laptop — they came to tick a step,
 * add its photo or read how to get in. The way back to the project, the title with the steps done,
 * then the crew, the way in and the steps. Read and sent through `useProjectScreen`, as the project.
 */
export function ProjectStepsScreen({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectScreen(projectId);
  const moves = useProjectMoves(projectId, screen);
  const word = projectPackWords(format.pack, locale);
  const words = projectDetailWords(t, word, format.date);
  const room = useRef<HTMLDivElement>(null);
  const { read } = screen;
  const project = read.kind === 'ready' ? read.value.project : null;
  const title =
    project === null
      ? null
      : projectTitleWords(t, {
          name: project.customer.name,
          number: project.number,
          place: project.customer.city,
        }).title;
  const said = words.said(screen.refusal, screen.failed, screen.lastMove ?? undefined);
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-project-page">
      <ProjectTrail
        acts={null}
        board={destinationLabel(t, moves.wayBack)}
        project={title}
        documents={words.steps}
        onBoard={moves.toWayBack}
        onProject={moves.toProject}
      />
      {read.kind === 'ready' && title !== null ? (
        <>
          <LargeTitle
            title={words.steps}
            summary={words.stepsSummary(
              title,
              read.value.view.stepsTicked,
              read.value.view.stepsTotal,
            )}
          />
          <ProjectInstallSteps
            project={read.value.project}
            words={{
              ...installerJobWords(t, word),
              noCrew: words.noCrew,
              accessNote: words.accessNote,
              changeAccess: words.changeAccess,
              done: words.done,
            }}
            refusal={screen.sheet === null ? said : null}
            {...projectStepsActsOf(screen, moves)}
          />
          <ProjectActSheet
            form={projectActFormOf(screen, read.value.project, moves.addCrew)}
            onClose={screen.close}
            sending={screen.sending}
            refusal={screen.sheet === null ? null : said}
            words={projectSheetWords(t, word, format.date)}
          />
          <ProjectToast
            screen={screen}
            words={projectToastWords(t, word, format.date)}
            focusAfter={room}
          />
        </>
      ) : read.kind === 'ready' ? null : (
        <ProjectDetailStates read={read} words={words} focusAfter={room} />
      )}
    </div>
  );
}
