import type { TranslatedText } from '@heliogrid/contracts';
import type { ProjectBoardView, StageGroup } from '@heliogrid/domain';
import { useId, useState } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { CardRows } from '../CardRows';
import { ProjectRowList } from '../ProjectRows';
import { Sheet } from '../Sheet';
import { groupLineOf, stageItemsOf } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { useHeld } from './use-held';
import './ProjectBoardStages.css';

type StagesProps = ProjectBoardProps & { view: ProjectBoardView };

/**
 * *All projects* on the narrow board: one pill names the stage shown and opens the stages as a
 * sheet; below it every stage holding a project — or the chosen one — as a card of its rows.
 */
export function ProjectBoardStages(props: StagesProps) {
  const { view, words, onChooseStage } = props;
  const [choosing, setChoosing] = useState(false);
  const heading = useId();
  const choose = (stage: ProjectBoardView['chosen']) => {
    onChooseStage(stage);
    setChoosing(false);
  };
  return (
    <section className="hg-project-board-section" aria-labelledby={heading}>
      <div className="hg-project-board-head">
        <h2 id={heading} className="hg-project-board-heading">
          {words.allProjects}
        </h2>
        <Pressable
          className={
            view.chosen === null
              ? 'hg-project-board-pill'
              : 'hg-project-board-pill hg-project-board-pill-chosen'
          }
          accessibilityHint={words.showStage}
          accessibilityState={{ expanded: choosing }}
          onPress={() => setChoosing(true)}
        >
          <span>{view.chosen === null ? words.allStages : words.stage(view.chosen)}</span>
          <ShellGlyph
            name="caret-down"
            size="sm"
            tone={view.chosen === null ? 'secondary' : 'accent'}
          />
        </Pressable>
      </div>
      {view.groups.map((group) => (
        <Group key={group.stage} group={group} {...props} />
      ))}
      <Sheet
        open={choosing}
        onClose={() => setChoosing(false)}
        title={words.showStage}
        subtitle={words.showStageLine}
        closeLabel={words.close}
      >
        <div className="hg-project-board-options">
          <Option
            label={words.allStages}
            line={null}
            count={view.liveCount}
            chosen={view.chosen === null}
            onPress={() => choose(null)}
          />
          {view.stops.map((stop) => (
            <Option
              key={stop.stage}
              label={words.stage(stop.stage)}
              line={words.stopLine(stop) ?? words.noneNow}
              count={stop.count}
              chosen={stop.chosen}
              onPress={() => choose(stop.stage)}
            />
          ))}
        </div>
      </Sheet>
    </section>
  );
}

function Option({
  label,
  line,
  count,
  chosen,
  onPress,
}: {
  label: TranslatedText;
  line: TranslatedText | null;
  count: number;
  chosen: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="hg-project-board-option"
      accessibilityRole="radio"
      accessibilityState={{ checked: chosen }}
      onPress={onPress}
    >
      <span className="hg-project-board-option-words">
        <span className="hg-project-board-option-name">{label}</span>
        {line === null ? null : <span className="hg-project-board-option-line">{line}</span>}
      </span>
      <span className="hg-project-board-option-count">{count}</span>
    </Pressable>
  );
}

/** One stage's projects as a card of rows: its overline, count and longest stay over them. */
function Group(props: StagesProps & { group: StageGroup }) {
  const { group, view, words } = props;
  const held = useHeld();
  const heading = useId();
  const line = groupLineOf(view, group, words);
  return (
    <section className="hg-project-board-group" aria-labelledby={heading}>
      <div className="hg-project-board-group-head">
        <h3 id={heading} className="hg-project-board-overline">
          {words.stage(group.stage)}
        </h3>
        <span className="hg-project-board-count">{group.rows.length}</span>
        {line === null ? null : <span className="hg-project-board-quiet">{line}</span>}
      </div>
      {group.rows.length === 0 ? (
        <CardRows>
          <li className="hg-project-board-none">{words.noneInStage(group.stage)}</li>
        </CardRows>
      ) : (
        <ProjectRowList items={stageItemsOf(group.rows, held, props)} />
      )}
    </section>
  );
}
