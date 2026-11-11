import type { ProjectFile, ProjectJob } from '@heliogrid/contracts';
import type { InstallerJobProps, InstallerPhotoPlace } from './InstallerJob.types';

/** What the job's acts send and read — `useProjectScreen`'s, by shape. */
export interface InstallerJobScreen {
  send(
    act:
      | { readonly kind: 'tick'; readonly step: string; readonly doneBy: string | null }
      | { readonly kind: 'untick'; readonly step: string },
  ): void;
  retryUpload(): void;
  readonly sending: boolean;
  readonly uploading: InstallerPhotoPlace | null;
  readonly uploadFailed: InstallerPhotoPlace | null;
}

/** Each platform's own moves: a photo picked or opened, the dialler, the way to the place. */
export interface InstallerJobMoves {
  photo(place: InstallerPhotoPlace): void;
  openFile(file: ProjectFile): void;
  call(phoneE164: string): void;
  directions(place: string): void;
}

type JobActs = Pick<
  InstallerJobProps,
  | 'onTick'
  | 'onUntick'
  | 'onPhoto'
  | 'onPhotoAndTick'
  | 'onRetryPhoto'
  | 'onOpenFile'
  | 'onCall'
  | 'onDirections'
  | 'sending'
  | 'uploading'
  | 'uploadFailed'
>;

/**
 * The job's acts, wired once for both platforms (Law 11): a tick, a photo, the call, the way — and,
 * where the screen ticks a step once its photo is on the project (`useInstallerJobs`), *Photo and
 * tick*: that tick asked for first, then the photo picked.
 */
export function installerJobActsOf(
  screen: InstallerJobScreen,
  moves: InstallerJobMoves,
  tickOncePhotographed?: (step: string, doneBy: string | null) => void,
): JobActs {
  const photo = (step: string) => moves.photo({ slot: 'step', slotKey: step });
  return {
    onTick: (step, doneBy) => screen.send({ kind: 'tick', step, doneBy }),
    onUntick: (step) => screen.send({ kind: 'untick', step }),
    onPhoto: photo,
    onPhotoAndTick:
      tickOncePhotographed === undefined
        ? undefined
        : (step, doneBy) => {
            tickOncePhotographed(step, doneBy);
            photo(step);
          },
    onRetryPhoto: () => screen.retryUpload(),
    onOpenFile: moves.openFile,
    onCall: (job: ProjectJob) => moves.call(job.phoneE164),
    onDirections: (job: ProjectJob) => {
      if (job.place !== null) moves.directions(job.place);
    },
    sending: screen.sending,
    uploading: screen.uploading,
    uploadFailed: screen.uploadFailed,
  };
}
