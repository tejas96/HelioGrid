import type { StaticScreenProps } from '@react-navigation/native';
import { ProjectPage } from './components/ProjectPage';
import { ProjectStepsPage } from './components/ProjectStepsPage';

/**
 * A project opens at `heliogrid://projects/<id>` — from the board, a notice or *Mark won*; the
 * board's *To do* opens it asking about its early proof (`ask`).
 */
type Props = StaticScreenProps<{ projectId: string; ask?: 'earlyProof' }>;

/**
 * One project on the phone (`SCR-M08-02`, the 375 frames): the project manager on site or between
 * calls, one hand, often outdoors on a slow network — they came to move the job on, upload a
 * paper or record a wait, each in a tap or two. Everything read and sent is `useProjectScreen`'s,
 * the web's too; the phone's own parts are the pickers, the dialler and the ways back.
 */
export function ProjectDetailScreen({ route }: Props) {
  return (
    <ProjectPage
      projectId={route.params.projectId}
      documents="waiting"
      ask={route.params.ask ?? null}
    />
  );
}

/** A project's whole checklist (`SCR-M08-03`) at `projects/<id>/documents`, beside its other files. */
export function ProjectDocumentsScreen({ route }: Props) {
  return <ProjectPage projectId={route.params.projectId} documents="all" ask={null} />;
}

/** A project's install steps (`SCR-M08-04`) at `projects/<id>/steps`, with the crew and how to get in. */
export function ProjectStepsScreen({ route }: Props) {
  return <ProjectStepsPage projectId={route.params.projectId} />;
}
