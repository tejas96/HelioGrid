import type { ProjectScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { projectRemindLine } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useNavigation } from '@react-navigation/native';
import { Linking, Share } from 'react-native';
import { useProjectFilePick } from '../../shared/use-file-pick';
import { doorRoute } from '../../shell/doors';

/**
 * The project's ways out on the phone — the platform adapter: back to where it was opened from,
 * its checklist, its steps and its handover, the system's own chooser for a file, a stored file in
 * the phone's viewer, the dialler, *Remind*'s share sheet with the line in the customer's language
 * — sent by the person, so no delivery is claimed — and the team's invite for a new crew.
 */
export function useProjectMoves(projectId: string, screen: ProjectScreen) {
  const navigation = useNavigation();
  const { locale } = useI18n();
  const project = screen.read.kind === 'ready' ? screen.read.value.project : null;
  return {
    back: () => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate(doorRoute.projects);
    },
    toProject: () => navigation.navigate('ProjectDetail', { projectId }),
    documents: () => navigation.navigate('ProjectDocuments', { projectId }),
    steps: () => navigation.navigate('ProjectSteps', { projectId }),
    handover: () => navigation.navigate('ProjectHandover', { projectId }),
    /** The payments page; with a part, its collect sheet opens on arrival. */
    payments: (collect?: string) =>
      navigation.navigate(
        'ProjectPayments',
        collect === undefined ? { projectId } : { projectId, collect },
      ),
    // The dispatch sheet is a modal over the page: it closes before Team opens, or it stays on top
    // of Team and a second tap opens Team again.
    addCrew: () => {
      screen.close();
      navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.team });
    },
    pick: useProjectFilePick(screen),
    openFile: (file: { readonly fileId: string }) => {
      void screen
        .fileLink(file.fileId)
        .then((url) => Linking.openURL(url))
        .catch(() => undefined);
    },
    call: () => {
      if (project !== null) void Linking.openURL(`tel:${project.customer.phoneE164}`);
    },
    remind: () => {
      if (project?.wait === null || project === null) return;
      const { wait, customer } = project;
      const facts = {
        name: customer.name,
        reason: wait.reason,
        language: customer.preferredLanguage,
      };
      void projectRemindLine(facts, locale)
        .then((message) => Share.share({ message }))
        .catch(() => undefined);
    },
  };
}

export type ProjectMoves = ReturnType<typeof useProjectMoves>;
