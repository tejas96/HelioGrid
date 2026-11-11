import type { ProjectDetail as ProjectDetailFacts } from '@heliogrid/contracts';
import { isClosedStage, isProjectStage } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { InstallerStepsProps } from '../InstallerJob/InstallerJob.types';
import type { ProjectBlock } from './ProjectDetail.blocks';
import { TILE_STROKE } from './ProjectDetail.logic';
import type { ProjectStepsProps } from './ProjectDetail.parts.types';
import type { DetailRow } from './ProjectDetail.rows';

/** A project closed — handed over or cancelled — takes no edit; a stage unknown here is closed too. */
export function isClosedProject(project: ProjectDetailFacts): boolean {
  return !isProjectStage(project.stage) || isClosedStage(project.stage);
}

/**
 * The installer's own steps, as the job screen draws them, over this project: its steps with their
 * photos, the acts the page wires, and nothing of the installer's job list — the project is the job.
 */
export function installerStepsOf(props: ProjectStepsProps): InstallerStepsProps {
  const { project, words, onTick, onUntick, onPhoto, onRetryPhoto, onOpenFile } = props;
  const site = { id: project.id, steps: project.steps, crew: project.crew };
  return {
    read: { kind: 'empty' },
    jobId: project.id,
    onChoose: () => undefined,
    site,
    words,
    onDirections: () => undefined,
    onCall: () => undefined,
    onTick,
    onUntick,
    onPhoto,
    onRetryPhoto,
    onOpenFile,
    sending: props.sending,
    uploading: props.uploading,
    uploadFailed: props.uploadFailed,
    steps: project.steps,
  };
}

/** The steps read only, for a reader whose grant does not reach them: done, who ticked, the photos. */
export function stepsReadOf(
  { project, words }: ProjectStepsProps,
  format: MarketFormat,
): ProjectBlock {
  const ticked = project.steps.filter((step) => step.tickedAt !== null).length;
  const rows = project.steps.map((step): DetailRow => {
    const done = step.tickedAt !== null;
    const by =
      step.tickedAt !== null && step.tickedBy !== null
        ? words.tickedBy(step.tickedBy.name, format.clockAt(step.tickedAt))
        : null;
    return {
      key: step.step,
      name: words.step(step.step),
      tile: {
        glyph: done ? 'tick' : 'camera',
        hue: done ? 'success' : 'neutral',
        size: 36,
        stroke: TILE_STROKE,
      },
      sub: by,
      files: step.files,
      mark: done ? { tone: 'success', label: words.done } : null,
      caption: null,
      acts: [],
      show: null,
      notSent: false,
      busy: false,
    };
  });
  return {
    title: words.steps,
    aside: words.count(ticked, project.steps.length),
    act: null,
    notSent: false,
    rows,
    none: words.none,
    more: null,
  };
}
