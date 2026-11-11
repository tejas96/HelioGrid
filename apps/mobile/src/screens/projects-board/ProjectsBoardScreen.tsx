import { useProjectBoardScreen } from '@heliogrid/data/react';
import { projectBoardWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  boardSummaryOf,
  type FocusHandle,
  LargeTitle,
  ProjectBoard,
  projectBoardActsOf,
  useFormat,
} from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { ShellNotFoundState } from '../shell/components/ShellNotFoundState';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * The Projects board on the phone (`SCR-M08-01`, the picked phone frames): the project manager or
 * the owner on site or between calls, one hand on the phone, often on a slow network — they came to
 * see what needs them and do it in one tap. What is read, searched, filtered and counted is
 * `useProjectBoardScreen`'s, the web's too; the phone's own parts are the ways to a project.
 */
export function ProjectsBoardScreen() {
  return (
    <ShellPage inView="projects">
      <ProjectsBoardPage />
    </ShellPage>
  );
}

function ProjectsBoardPage() {
  const screen = useProjectBoardScreen();
  const { t, locale } = useI18n();
  const format = useFormat();
  const navigation = useNavigation();
  const title = useRef<FocusHandle>(null);
  if (!screen.allowed) return <ShellNotFoundState />;
  const words = projectBoardWords(t, format.pack, locale);
  const open = (projectId: string, ask: 'earlyProof' | null) =>
    navigation.navigate('ProjectDetail', ask === null ? { projectId } : { projectId, ask });
  const summary = boardSummaryOf(screen.read);
  return (
    <ProjectBoard
      {...projectBoardActsOf(screen, open)}
      head={
        <LargeTitle
          title={words.title}
          titleRef={title}
          summary={summary === null ? undefined : words.summary(summary)}
        />
      }
      words={words}
      openId={null}
      focusAfter={title}
    />
  );
}
