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
  ProjectActSheet,
  ProjectDetailStates,
  ProjectInstallSteps,
  projectActFormOf,
  projectStepsActsOf,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { ProjectToast } from '../../shared/ProjectToast';
import { ShellPage } from '../../shell/components/ShellPage';
import { useProjectMoves } from '../hooks/use-project-moves';
import { styles } from '../styles';

/**
 * A project's install steps on the phone (`SCR-M08-04`), from the hero's *Steps and photos*: the
 * large title says the steps done, then the crew, how to get in and the installer's own steps — a
 * large tick and a photo each — with the one sheet (how to get in) and the toast an act leaves.
 */
export function ProjectStepsPage({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectScreen(projectId);
  const moves = useProjectMoves(projectId, screen);
  const word = projectPackWords(format.pack, locale);
  const words = projectDetailWords(t, word, format.date);
  const page = useRef<View>(null);
  const { read } = screen;
  const shown = read.kind === 'ready' ? read.value : null;
  const name =
    shown === null
      ? destinationLabel(t, 'projects')
      : projectTitleWords(t, {
          name: shown.project.customer.name,
          number: shown.project.number,
          place: shown.project.customer.city,
        }).title;
  const said = words.said(screen.refusal, screen.failed, screen.lastMove ?? undefined);
  return (
    <ShellPage
      inView="projects"
      drillDown={{
        title: words.steps,
        ...(shown === null
          ? {}
          : {
              summary: words.stepsSummary(name, shown.view.stepsTicked, shown.view.stepsTotal),
            }),
        back: words.back,
        onBack: moves.back,
      }}
    >
      <View ref={page} style={styles.page}>
        {shown === null ? (
          read.kind === 'ready' ? null : (
            <ProjectDetailStates read={read} words={words} focusAfter={page} />
          )
        ) : (
          <>
            <ProjectInstallSteps
              project={shown.project}
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
              form={projectActFormOf(screen, shown.project, moves.addCrew)}
              onClose={screen.close}
              sending={screen.sending}
              refusal={screen.sheet === null ? null : said}
              words={projectSheetWords(t, word, format.date)}
            />
            <ProjectToast
              screen={screen}
              words={projectToastWords(t, word, format.date)}
              focusAfter={page}
            />
          </>
        )}
      </View>
    </ShellPage>
  );
}
