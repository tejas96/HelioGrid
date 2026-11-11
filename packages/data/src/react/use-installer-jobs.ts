'use client';
import type { ProjectJob } from '@heliogrid/contracts';
import { composedHome, type Read, showsInstallerJob } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { type ProjectScreen, useProjectScreen } from './use-project-screen';
import { useSession } from './use-session';

export interface InstallerJobs {
  /** The home in force, or one composed into it, is the installer's: its job is drawn (`M08-45`). */
  readonly shown: boolean;
  /** The chosen job's project — its steps and photos, its ticks and uploads. */
  readonly project: ProjectScreen;
  /** The installer's assigned live jobs; empty with none dispatched to them. */
  readonly read: Read<readonly ProjectJob[]>;
  /** The job on screen: the one chosen, else the first. */
  readonly jobId: string | null;
  choose(jobId: string): void;
  /**
   * *Photo and tick*: ticks the step — with who did the work, where it was someone else — once its
   * photo is on the project. Asked before the photo is picked; a photo that did not go up keeps it
   * waiting for its *Retry*, and a newer ask replaces it.
   */
  tickOncePhotographed(step: string, doneBy: string | null): void;
}

/** A tick waiting for its step's photo, on the job it was asked on. */
interface WaitingTick {
  readonly jobId: string;
  readonly step: string;
  readonly doneBy: string | null;
}

/**
 * The tick a step waits to send once its photo is on the project: sent when the project's read
 * shows the photo and nothing else is out; dropped once the step is ticked, gone, or the job is no
 * longer on screen.
 */
function useTickOncePhotographed(project: ProjectScreen, jobId: string | null) {
  const [waiting, setWaiting] = useState<WaitingTick | null>(null);
  const { read, uploading, sending, send } = project;
  const steps = read.kind === 'ready' ? read.value.project.steps : null;
  useEffect(() => {
    if (waiting === null || steps === null) return;
    const step = steps.find((each) => each.step === waiting.step);
    if (waiting.jobId !== jobId || step === undefined || step.tickedAt !== null) {
      setWaiting(null);
      return;
    }
    if (step.files.length === 0 || uploading !== null || sending) return;
    setWaiting(null);
    send({ kind: 'tick', step: waiting.step, doneBy: waiting.doneBy });
  }, [waiting, steps, jobId, uploading, sending, send]);
  return (step: string, doneBy: string | null) => {
    if (jobId !== null) setWaiting({ jobId, step, doneBy });
  };
}

/**
 * The installer's job home (`SCR-M08-05`): the jobs their crew is on — the first is today's — and
 * the one chosen. Its steps, photos and ticks are the project's own (`useProjectScreen`), which the
 * crew reaches through its scope; nothing commercial is read here (`M08-43`).
 */
export function useInstallerJobs(): InstallerJobs {
  const repositories = useRepositories();
  const { user, chosenHome } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const shown = showsInstallerJob(composedHome(user?.tenant?.roles ?? [], chosenHome));
  const [chosen, setChosen] = useState<string | null>(null);
  const jobs = useQuery({
    queryKey: queryKeys.projects.jobs(tenantId),
    queryFn: ({ signal }) => repositories.projects.jobs(signal),
    enabled: tenantId !== '' && shown,
  });
  const read = readOf(jobs, (value) => value.length === 0);
  const list = jobs.data ?? [];
  const jobId = list.some((job) => job.id === chosen) ? chosen : (list[0]?.id ?? null);
  const project = useProjectScreen(jobId ?? '');
  const tickOncePhotographed = useTickOncePhotographed(project, jobId);
  return { shown, project, read, jobId, choose: setChosen, tickOncePhotographed };
}
