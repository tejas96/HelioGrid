import type { ProjectDetail as ProjectDetailFacts } from '@heliogrid/contracts';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { HueTile } from '../HueTile';
import { PARTY_GLYPH, TILE_STROKE, waitDaysOf } from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';

type OpenWait = NonNullable<ProjectDetailFacts['wait']>;

/**
 * Who the project waits on: the open wait with *Wait is over* and, for a customer, *Remind*; with
 * none open, a quiet ask to say who — for a reader who moves stages, on a live project. A closed
 * project waits on no one.
 */
export function ProjectWait(props: ProjectDetailProps) {
  const { project, view, words, onWait, sending } = props;
  if (view.closed) return null;
  if (project.wait !== null) return <WaitCard {...props} wait={project.wait} />;
  if (!project.acts.stages) return null;
  return (
    <Pressable
      className="hg-project-detail-ask"
      accessibilityRole="button"
      accessibilityLabel={words.noWaitTitle}
      accessibilityHint={words.noWaitLine}
      ripple="bounded"
      onPress={() => {
        if (!sending) onWait();
      }}
    >
      <HueTile glyph="clock" hue="neutral" size={40} stroke={TILE_STROKE} />
      <span className="hg-project-detail-ask-words">
        <span className="hg-project-detail-ask-title">{words.noWaitTitle}</span>
        <span className="hg-project-detail-row-sub">{words.noWaitLine}</span>
      </span>
      <ShellGlyph name="chevron-right" size="md" tone="secondary" />
    </Pressable>
  );
}

/**
 * The open wait: the party's tile, *Waiting on X*, why and since when, the days it has run, and its
 * acts. *Wait is over* leaves with the card, and the focus lands on the hero's act.
 */
function WaitCard({
  project,
  words,
  onWaitOver,
  onRemind,
  sending,
  heroFocus,
  wait,
}: ProjectDetailProps & { wait: OpenWait }) {
  const leaving = useFocusAfter(heroFocus);
  const mayAct = project.acts.stages;
  return (
    <Card density="functional" className="hg-project-detail-wait">
      <div className="hg-project-detail-wait-head">
        <HueTile
          glyph={PARTY_GLYPH[wait.party] ?? 'clock'}
          hue="warning"
          size={40}
          stroke={TILE_STROKE}
        />
        <div className="hg-project-detail-wait-words">
          <span className="hg-project-detail-wait-title">{words.waitTitle(wait.party)}</span>
          <span className="hg-project-detail-row-sub">
            {words.waitLine(wait.reason, wait.startedOn)}
          </span>
          {wait.note === null ? null : <span className="hg-project-detail-note">{wait.note}</span>}
        </div>
        <span className="hg-project-detail-days">{words.days(waitDaysOf(project))}</span>
      </div>
      {mayAct ? (
        <div className="hg-project-detail-wait-acts">
          <Button
            variant="secondary"
            size="sm"
            icon={<ShellGlyph name="tick" size="sm" tone="primary" />}
            onClick={leaving(() => {
              if (!sending) onWaitOver();
            })}
          >
            {words.waitOver}
          </Button>
          {wait.party === 'customer' ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<ShellGlyph name="send" size="sm" tone="primary" />}
              onClick={onRemind}
            >
              {words.remind}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
