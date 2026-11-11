import { Button } from '../Button';
import { HueTile } from '../HueTile';
import { TILE_STROKE } from '../ProjectDetail/ProjectDetail.logic';
import { Timeline } from '../Timeline';
import { earlyStepsOf, footOf, keepOf } from './ProjectActSheet.logic';
import type { ProjectFormOf } from './ProjectActSheet.types';
import { ProjectSheetSend } from './ProjectSheetSend';

/**
 * A proof that came early (ruling 1, the picked design): the spark, what the move does — where it
 * stands now, the stages that count as passed, and the stage the file moves it to — then *Move*,
 * or *Not now* and the file stays on the project.
 */
export function EarlyForm({ form, words, ...frame }: ProjectFormOf<'earlyProof'>) {
  return (
    <>
      <span className="hg-project-act-moment">
        <HueTile glyph="spark" hue="teal" size={56} stroke={TILE_STROKE} />
      </span>
      <div className="hg-project-act-sees">
        <Timeline variant="page" density="functional" items={earlyStepsOf(form, words)} />
      </div>
      <ProjectSheetSend
        label={words.early.send(form.to)}
        ready
        {...footOf(frame)}
        onSend={form.onSend}
        glyph={null}
        destructive={false}
      />
      <Button {...keepOf(frame)}>{words.early.keep}</Button>
    </>
  );
}
