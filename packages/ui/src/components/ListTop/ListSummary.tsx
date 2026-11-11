import { Pressable } from '../../primitives/Pressable';
import { HeroPanel } from '../HeroPanel';
import { HueTile } from '../HueTile';
import { StageMeter } from '../StageMeter/StageMeter';
import { ListStageBar } from './ListStageBar';
import { FIGURE_TILE } from './ListTop.logic';
import type { ListFigure, ListRoom, ListSummaryProps } from './ListTop.types';

/** A figure: its count over its word, a button where it narrows or opens what it counts. */
function Figure({ figure, lead }: { figure: ListFigure; lead: boolean }) {
  const inner = (
    <>
      {figure.glyph === undefined ? null : (
        <HueTile glyph={figure.glyph.name} hue={figure.glyph.hue} {...FIGURE_TILE} />
      )}
      <span className="hg-list-summary-value" aria-hidden="true">
        {figure.value}
      </span>
      <span className="hg-list-summary-word" aria-hidden="true">
        {figure.label}
      </span>
    </>
  );
  const look = lead ? 'lead' : 'side';
  if (figure.onPress === undefined) {
    return (
      <span className="hg-list-summary-figure" data-look={look}>
        <span className="hg-spoken-only">{figure.spoken}</span>
        {inner}
      </span>
    );
  }
  return (
    <Pressable
      className="hg-list-summary-figure"
      accessibilityLabel={figure.spoken}
      accessibilityState={figure.pressed === undefined ? undefined : { selected: figure.pressed }}
      onPress={figure.onPress}
    >
      <span className="hg-list-summary-face" data-look={look}>
        {inner}
      </span>
    </Pressable>
  );
}

/** The list's one hero: the main figure large, the others beside it, and the stages when wide. */
export function ListSummary({ summary, room }: { summary: ListSummaryProps; room: ListRoom }) {
  return (
    <HeroPanel name={summary.name} label={summary.label}>
      <div className="hg-list-summary" data-room={room}>
        <div className="hg-list-summary-figures">
          <Figure figure={summary.lead} lead />
          <span className="hg-list-summary-rule" aria-hidden="true" />
          <div className="hg-list-summary-side">
            {summary.side.map((figure) => (
              <Figure key={figure.label} figure={figure} lead={false} />
            ))}
          </div>
        </div>
        {summary.note === null ? null : <p className="hg-list-summary-note">{summary.note}</p>}
        {summary.stages === null ? null : room === 'wide' ? (
          <div className="hg-list-summary-stages">
            <StageMeter {...summary.stages} />
          </div>
        ) : (
          <ListStageBar stages={summary.stages} />
        )}
      </div>
    </HeroPanel>
  );
}
