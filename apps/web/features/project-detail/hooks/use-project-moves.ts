'use client';
import { type FilePlace, type ProjectScreen, useShell } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type ShellDoor, type StandingDestination } from '@heliogrid/domain';
import { projectRemindLine } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useRouter } from 'next/navigation';
import { openExternal } from '../../../lib/open-external';
import { pickProjectFile } from '../../../lib/pick-file';
import { HOME_ROUTE } from '../../auth';
import {
  DOOR_PATH,
  projectDocumentsPath,
  projectHandoverPath,
  projectPath,
  projectPaymentsPath,
  projectStepsPath,
  settingsRowPath,
} from '../../shell';

/** A project's install steps on their own page (`SCR-M08-04`). */

/**
 * The project's web moves — the platform adapter: the router, the browser's own file chooser (a
 * photo shrunk before it goes up), a stored file opened in a new tab, the dialler, and *Remind*'s
 * line in the customer's language copied for the person to paste into their own chat — no
 * delivery is claimed.
 */
export function useProjectMoves(projectId: string, screen: ProjectScreen) {
  const router = useRouter();
  const { locale } = useI18n();
  const project = screen.read.kind === 'ready' ? screen.read.value.project : null;
  const wayBack = wayBackOf(useShell().doors);
  return {
    wayBack,
    toWayBack: () => router.push(wayBack === 'home' ? HOME_ROUTE : DOOR_PATH[wayBack]),
    toProject: () => router.push(projectPath(projectId)),
    documents: () => router.push(projectDocumentsPath(projectId)),
    steps: () => router.push(projectStepsPath(projectId)),
    handover: () => router.push(projectHandoverPath(projectId)),
    /** The payments page; with a part, its collect sheet opens on arrival. */
    payments: (collect?: string) => router.push(projectPaymentsPath(projectId, collect)),
    addCrew: () => router.push(settingsRowPath(SETTINGS_SEGMENT.team)),
    pick: (place: FilePlace) => pickProjectFile(screen, place),
    openFile: (file: { readonly fileId: string }) => {
      void screen.fileLink(file.fileId).then(
        (url) => openExternal(url),
        () => undefined,
      );
    },
    call: () => {
      if (project !== null) window.location.href = `tel:${project.customer.phoneE164}`;
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
        .then((message) => navigator.clipboard.writeText(message))
        .then(
          () => screen.say({ kind: 'copied' }),
          () => screen.say({ kind: 'notCopied' }),
        );
    },
  };
}

export type ProjectMoves = ReturnType<typeof useProjectMoves>;

/**
 * Where the trail's first step goes: the board for a person whose shell opens it, else the leads
 * a seller reached their project from, else home — a step to a door the person lacks lands on
 * "This page does not exist".
 */
export function wayBackOf(doors: readonly ShellDoor[]): StandingDestination {
  return WAYS_BACK.find((door) => doors.includes(door)) ?? 'home';
}

const WAYS_BACK = ['projects', 'leads'] as const satisfies readonly ShellDoor[];
