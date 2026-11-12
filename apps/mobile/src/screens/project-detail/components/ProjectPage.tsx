import { useProjectScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  projectDetailWords,
  projectPackWords,
  projectTitleWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  ProjectDetailStates,
  ProjectFacts,
  ProjectHeadActs,
  type ProjectPageRoute,
  projectHeadActsOf,
  useFormat,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../../shell/components/ShellPage';
import { useProjectMoves } from '../hooks/use-project-moves';
import { styles } from '../styles';
import { ProjectDetailBody } from './ProjectDetailBody';

/**
 * The project page or its checklist: the large title names the customer, its facts and its acts —
 * the call and the ⋯ — sit under it, and the body is the project once read, else its loading,
 * failed or gone state. The page stays while a failed read is tried again, so the screen reader
 * lands on it.
 */
export function ProjectPage({ projectId, documents, ask }: ProjectPageRoute) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const screen = useProjectScreen(projectId, ask);
  const moves = useProjectMoves(projectId, screen);
  const words = projectDetailWords(t, projectPackWords(format.pack, locale), format.date);
  const page = useRef<View>(null);
  const { read } = screen;
  const shown = read.kind === 'ready' ? read.value : null;
  const heading =
    shown === null
      ? { title: destinationLabel(t, 'projects') }
      : projectTitleWords(t, {
          name: shown.project.customer.name,
          number: shown.project.number,
          place: shown.project.customer.city,
        });
  const title =
    documents === 'all' && shown !== null
      ? {
          title: words.documents,
          summary: words.docsSummary(
            heading.title,
            shown.view.documentsDone,
            shown.view.documentsTotal,
          ),
        }
      : heading;
  return (
    <ShellPage
      inView="projects"
      drillDown={{
        ...title,
        back: words.back,
        onBack: moves.back,
        stripless: true,
        searchless: true,
        actions:
          shown === null || documents === 'all' ? undefined : (
            <ProjectHeadActs
              form="bar"
              project={shown.project}
              view={shown.view}
              words={words}
              {...projectHeadActsOf(screen, moves)}
            />
          ),
      }}
    >
      <View ref={page} style={styles.page}>
        {shown === null || documents === 'all' ? null : (
          <View style={styles.head}>
            <ProjectFacts project={shown.project} words={words} />
          </View>
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
          <ProjectDetailStates read={read} words={words} focusAfter={page} />
        )}
      </View>
    </ShellPage>
  );
}
