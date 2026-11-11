import type { ProjectFile, TranslatedText } from '@heliogrid/contracts';
import { useState } from 'react';
import type { PressableProps } from '../../primitives/Pressable/Pressable.types';
import type { ButtonProps } from '../Button/Button.types';
import { useFormat } from '../MarketProvider';
import {
  doneByOf,
  hasPhoto,
  type InstallerStepState,
  isStepPlace,
  nextStepOf,
  progressOf,
  stepStateOf,
} from './InstallerJob.logic';
import type { InstallerStep, InstallerStepsProps } from './InstallerJob.types';

type ButtonAct = Omit<ButtonProps, 'children' | 'icon'>;

/** One step's row as both halves draw it: its tile, who ticked it, and its one act. */
export interface InstallerStepRow {
  readonly key: string;
  readonly first: boolean;
  /** Its tick or its photo is out. */
  readonly busy: boolean;
  readonly name: TranslatedText;
  readonly state: InstallerStepState;
  /** The tile, pressed: ticks or unticks the step; null while its photo waits for its retry. */
  readonly tile: Pick<
    PressableProps,
    'accessibilityRole' | 'accessibilityState' | 'accessibilityLabel' | 'disabled' | 'onPress'
  > | null;
  /** Who ticked it and when, and who did the work where someone else did. */
  readonly lines: readonly { readonly key: string; readonly text: string }[];
  /** The step's photos on the project, each opened by its own name. */
  readonly photos: readonly ProjectFile[];
  /** Sends again a photo that did not reach the project; none while nothing failed. */
  readonly retry: ButtonAct | null;
  /** The next step's act — *Photo and tick* — or its photo alone; none on every other row. */
  readonly act: (ButtonAct & { readonly label: TranslatedText }) | null;
}

/** What a row's tile and act do: a tick, an untick, a photo then its tick, a retry. */
interface StepPresses {
  tick(step: InstallerStep): void;
  photoAndTick(step: InstallerStep): void;
}

type RowFacts = Pick<
  InstallerStepsProps,
  'words' | 'sending' | 'uploading' | 'uploadFailed' | 'onPhoto' | 'onPhotoAndTick' | 'onRetryPhoto'
> & {
  readonly next: string | null;
  readonly pressed: string | null;
  readonly clockAt: (at: string) => string;
};

/** Who ticked the step and when, and who did the work where someone else did. */
function linesOf(step: InstallerStep, facts: RowFacts) {
  const lines: { key: string; text: string }[] = [];
  if (step.tickedAt !== null) {
    const at = facts.clockAt(step.tickedAt);
    const text = step.tickedBy === null ? at : facts.words.tickedBy(step.tickedBy.name, at);
    lines.push({ key: 'ticked', text });
  }
  if (step.doneBy !== null) lines.push({ key: 'doneBy', text: facts.words.doneByWho(step.doneBy) });
  return lines;
}

/** The next step's act: *Photo and tick* where the screen takes both, else its photo alone. */
function actOf(
  step: InstallerStep,
  facts: RowFacts,
  presses: StepPresses,
  busy: boolean,
): InstallerStepRow['act'] {
  const { words, uploading, onPhotoAndTick } = facts;
  const sendingPhoto = isStepPlace(uploading, step.step);
  const name = words.step(step.step);
  return {
    label: onPhotoAndTick === undefined ? words.photo : words.photoAndTick,
    spokenName: onPhotoAndTick === undefined ? words.photoStep(name) : words.photoAndTickStep(name),
    variant: 'secondary',
    size: 'sm',
    loading: busy,
    disabled: facts.sending || (uploading !== null && !sendingPhoto),
    onClick: () =>
      onPhotoAndTick === undefined ? facts.onPhoto(step.step) : presses.photoAndTick(step),
  };
}

function rowOf(
  step: InstallerStep,
  index: number,
  facts: RowFacts,
  presses: StepPresses,
): InstallerStepRow {
  const state = stepStateOf(step, facts.uploadFailed);
  const sendingPhoto = isStepPlace(facts.uploading, step.step);
  const busy = (facts.sending && facts.pressed === step.step) || sendingPhoto;
  const name = facts.words.step(step.step);
  /* Where the screen takes a photo and its tick, a step still to do is ticked by its photo. */
  const press =
    facts.onPhotoAndTick !== undefined && step.tickedAt === null
      ? presses.photoAndTick
      : presses.tick;
  return {
    key: step.step,
    first: index === 0,
    busy,
    name,
    state,
    tile:
      state === 'failed'
        ? null
        : {
            accessibilityRole: 'checkbox',
            accessibilityState: { checked: step.tickedAt !== null, busy },
            accessibilityLabel: name,
            disabled: facts.sending || sendingPhoto,
            onPress: () => press(step),
          },
    lines: linesOf(step, facts),
    photos: step.files ?? [],
    retry:
      state === 'failed'
        ? {
            variant: 'primary',
            size: 'sm',
            spokenName: facts.words.retryPhotoStep(name),
            onClick: () => facts.onRetryPhoto(step.step),
          }
        : null,
    act: state === 'todo' && step.step === facts.next ? actOf(step, facts, presses, busy) : null,
  };
}

/**
 * The steps' own state: the tick pressed last — its row busy while the tick is out, and every tick
 * waiting — and *Done by someone else?*, whose name rides on the ticks that follow while it is open.
 */
export function useInstallerSteps(props: InstallerStepsProps) {
  const { steps, sending, onTick, onUntick, onPhotoAndTick } = props;
  const format = useFormat();
  const [pressed, setPressed] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [doneBy, setDoneBy] = useState('');
  const tick = (step: InstallerStep) => {
    if (sending) return;
    setPressed(step.step);
    if (step.tickedAt !== null) onUntick(step.step);
    else onTick(step.step, doneByOf(doneBy));
  };
  const presses: StepPresses = {
    tick,
    /* A step whose photo is already on the project needs only its tick. */
    photoAndTick: (step) => {
      if (hasPhoto(step) || onPhotoAndTick === undefined) tick(step);
      else if (!sending) onPhotoAndTick(step.step, doneByOf(doneBy));
    },
  };
  const facts: RowFacts = {
    ...props,
    next: nextStepOf(steps),
    pressed,
    clockAt: format.clockAt,
  };
  const rows = steps.map((step, index) => rowOf(step, index, facts, presses));
  const doneByToggle: Omit<ButtonProps, 'children'> = {
    variant: 'ghost',
    size: 'sm',
    expanded: naming,
    onClick: () => {
      /* Closed, the name goes with it: no tick carries a name the person cannot see. */
      if (naming) setDoneBy('');
      setNaming(!naming);
    },
  };
  return { rows, progress: progressOf(steps), naming, doneBy, setDoneBy, doneByToggle };
}
