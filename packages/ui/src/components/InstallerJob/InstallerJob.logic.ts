import type { ProjectJob } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HueTileTone } from '../HueTile/HueTile.types';
import type { InstallerJobSite, InstallerPhotoPlace, InstallerStep } from './InstallerJob.types';

/** The job on screen, and the installer's other assigned jobs to switch to. */
export function jobsOf(
  jobs: readonly ProjectJob[],
  jobId: string | null,
): { readonly job: ProjectJob | null; readonly others: readonly ProjectJob[] } {
  const job = jobs.find((each) => each.id === jobId) ?? jobs[0] ?? null;
  return { job, others: jobs.filter((each) => each !== job) };
}

/** The job's project read, when it is this job's — a read of the job before is not. */
export function siteOf(job: ProjectJob, site: InstallerJobSite | null): InstallerJobSite | null {
  return site !== null && site.id === job.id ? site : null;
}

/**
 * The job's steps: the project's own once read — they carry each step's photos — else the job's,
 * which carry the ticks alone.
 */
export function stepsOf(job: ProjectJob, site: InstallerJobSite | null): readonly InstallerStep[] {
  return siteOf(job, site)?.steps ?? job.steps.map((step) => ({ ...step, files: null }));
}

/** How far the job is: steps ticked, steps with a photo, of all — counted, never a % bar. */
export function progressOf(steps: readonly InstallerStep[]): {
  readonly ticked: number;
  readonly photographed: number;
  readonly total: number;
} {
  return {
    ticked: steps.filter((step) => step.tickedAt !== null).length,
    photographed: steps.filter((step) => hasPhoto(step)).length,
    total: steps.length,
  };
}

/** Whether a place is this step's photo. */
export function isStepPlace(place: InstallerPhotoPlace | null, step: string): boolean {
  return place !== null && place.slot === 'step' && place.slotKey === step;
}

/** The access note as the lines the crew reads — keys, gate, dogs, ladder, who to call. */
export function accessLinesOf(note: string | null): readonly string[] {
  if (note === null) return [];
  return note
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** The name the person typed for who did the work, or none. */
export function doneByOf(typed: string): string | null {
  const name = typed.trim();
  return name === '' ? null : name;
}

/** A step whose photo the project's read shows; unknown until that read lands. */
export function hasPhoto(step: InstallerStep): boolean {
  return step.files !== null && step.files.length > 0;
}

/** The step the crew does next: the first not yet ticked, in the job's order; none once all are. */
export function nextStepOf(steps: readonly InstallerStep[]): string | null {
  return steps.find((step) => step.tickedAt === null)?.step ?? null;
}

/** How a step's tile reads: ticked, its photo not sent, or still to do. */
export type InstallerStepState = 'done' | 'failed' | 'todo';

export function stepStateOf(
  step: InstallerStep,
  uploadFailed: InstallerPhotoPlace | null,
): InstallerStepState {
  if (isStepPlace(uploadFailed, step.step)) return 'failed';
  return step.tickedAt === null ? 'todo' : 'done';
}

/** Each tile's glyph and its tone: done is a tick, a photo not sent its retry, to do the camera. */
export const STEP_TILE: Record<
  InstallerStepState,
  { readonly glyph: ShellGlyphName; readonly hue: HueTileTone }
> = {
  done: { glyph: 'tick', hue: 'success' },
  failed: { glyph: 'retry', hue: 'warning' },
  todo: { glyph: 'camera', hue: 'neutral' },
};
/** The first name of the crew on the job, for the summary; none while no crew is known. */
export function crewNameOf(site: InstallerJobSite | null): string | null {
  return site?.crew[0]?.name ?? null;
}
