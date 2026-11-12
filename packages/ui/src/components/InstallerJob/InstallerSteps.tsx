import type { ProjectFile } from '@heliogrid/contracts';
import { Pressable } from '../../primitives/Pressable';
import { StatusMark } from '../../primitives/StatusMark';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { FileLink } from '../FileLink';
import { HueTile } from '../HueTile';
import { Input } from '../Input';
import { LoadingBars } from '../LoadingBars';
import { hasPhoto, progressOf, STEP_TILE } from './InstallerJob.logic';
import type {
  InstallerJobWords,
  InstallerPhotosProps,
  InstallerStepsProps,
} from './InstallerJob.types';
import { type InstallerStepRow, useInstallerSteps } from './use-installer-steps';

/**
 * The job's steps: ticked of all, then each step — its tile (done, a photo not sent, to do), who
 * ticked it and when, and on the next step alone its *Photo and tick*. While a tick is out every
 * tick waits; a photo that did not reach the project says so on its row with its *Retry*. The tile
 * ticks or unticks its step. *Done by someone else?* names who did the work for the ticks that
 * follow.
 */
export function InstallerSteps(props: InstallerStepsProps) {
  const { words, sending } = props;
  const { rows, progress, naming, doneBy, setDoneBy, doneByToggle } = useInstallerSteps(props);
  if (rows.length === 0) return null;
  return (
    <section className="hg-installer-job-section" aria-label={words.steps}>
      <div className="hg-installer-job-section-head">
        <h2 className="hg-installer-job-heading">{words.steps}</h2>
        <span className="hg-installer-job-count">
          {words.stepsCount(progress.ticked, progress.total)}
        </span>
      </div>
      <CardRows form="joined">
        {rows.map((row) => (
          <StepRow key={row.key} row={row} words={words} onOpenFile={props.onOpenFile} />
        ))}
      </CardRows>
      <div className="hg-installer-job-done-by">
        <Button {...doneByToggle}>{words.doneBy}</Button>
        {naming ? (
          <Input
            label={words.doneBy}
            labelSpokenOnly
            value={doneBy}
            onChange={setDoneBy}
            disabled={sending}
          />
        ) : null}
      </div>
    </section>
  );
}

function StepTile({ row }: { row: InstallerStepRow }) {
  const tile = <HueTile {...STEP_TILE[row.state]} size={44} stroke={glyphStroke('md')} />;
  if (row.tile === null) return <span className="hg-installer-step-tap">{tile}</span>;
  return (
    <Pressable className="hg-installer-step-tap" haptic="impact" {...row.tile}>
      {tile}
    </Pressable>
  );
}

function StepRow({
  row,
  words,
  onOpenFile,
}: {
  row: InstallerStepRow;
  words: InstallerJobWords;
  onOpenFile: (file: ProjectFile) => void;
}) {
  return (
    <CardRow first={row.first} busy={row.busy} className="hg-installer-step">
      <StepTile row={row} />
      <span className="hg-installer-step-main">
        {/* The tile, a checkbox, already says the step's name. */}
        <span className="hg-installer-step-name" aria-hidden={row.tile === null ? undefined : true}>
          {row.name}
        </span>
        {row.lines.map((line) => (
          <span key={line.key} className="hg-installer-step-line">
            {line.text}
          </span>
        ))}
        {row.photos.map((photo) => (
          <FileLink key={photo.id} name={photo.name} onOpen={() => onOpenFile(photo)} />
        ))}
        {row.state === 'failed' ? (
          <span className="hg-installer-step-failed">{words.photoNotSent}</span>
        ) : null}
      </span>
      {row.retry === null ? null : (
        <span className="hg-installer-step-act">
          <Button {...row.retry} icon={<ShellGlyph name="retry" size="sm" tone="inverse" />}>
            {words.retryPhoto}
          </Button>
        </span>
      )}
      {row.act === null ? null : (
        <span className="hg-installer-step-act">
          <Button {...row.act} icon={<ShellGlyph name="camera" size="sm" tone="primary" />}>
            {row.act.label}
          </Button>
        </span>
      )}
    </CardRow>
  );
}

/**
 * The photos the job expects — one per step (`M08-45`): the steps with a photo of all, each step's
 * word in a mark that says whether its photo is in. Until the project's read lands they are not
 * known, and the block waits.
 */
export function InstallerPhotos({ words, steps, known }: InstallerPhotosProps) {
  if (steps.length === 0) return null;
  const { photographed, total } = progressOf(steps);
  return (
    <section
      className="hg-installer-job-section"
      aria-label={words.photosTitle}
      aria-busy={known ? undefined : true}
    >
      <div className="hg-installer-job-section-head">
        <h2 className="hg-installer-job-heading">{words.photosTitle}</h2>
        {known ? (
          <span className="hg-installer-job-count">{words.count(photographed, total)}</span>
        ) : null}
      </div>
      {known ? (
        <ul className="hg-installer-job-photos">
          {steps.map((step) => (
            <li key={step.step}>
              <StatusMark
                className="hg-installer-job-photo"
                tone={hasPhoto(step) ? 'success' : 'neutral'}
                label={words.step(step.step)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <LoadingBars bars={['line', 'line']} inBusyRegion />
      )}
    </section>
  );
}
