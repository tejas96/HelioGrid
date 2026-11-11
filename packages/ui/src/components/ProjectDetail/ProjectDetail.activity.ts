import type { ProjectDetail as ProjectDetailFacts, TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import type { ProjectDetailWords, ProjectEventKind } from './ProjectDetail.types';

/** One line of the project's activity: what happened, who or what did it, and its day. */
export interface ProjectEvent {
  readonly key: string;
  readonly title: TranslatedText;
  /** Who or what did it, or why the wait began. */
  readonly line: TranslatedText | null;
  readonly on: string;
}

/** The activity the page shows — the latest few, newest first; nothing edits after the fact. */
export const EVENTS_SHOWN = 3;

type Move = ProjectDetailFacts['journey'][number];

const chainOrder = (stage: string, chain: readonly string[]) => chain.indexOf(stage);

/** What a move was, read off the move itself: the start, a proof, an undo, a cancel, a step back or a tap. */
function kindOf(move: Move, chain: readonly string[]): ProjectEventKind {
  if (move.from === null) return 'started';
  if (move.cause === 'proof') return 'movedAuto';
  if (move.cause === 'undo') return 'undone';
  if (move.cause === 'cancel') return 'cancelled';
  return chainOrder(move.to, chain) < chainOrder(move.from, chain) ? 'movedBack' : 'moved';
}

/** Who or what made a move, said as the journey says it. */
function lineOf(
  move: Move,
  kind: ProjectEventKind,
  words: ProjectDetailWords,
): TranslatedText | null {
  // The title says HelioGrid moved it; the line says what proved it.
  if (move.cause === 'proof') return words.proofName(move.proof);
  if (move.movedBy === null) return null;
  return kind === 'started' ? words.byMarkWon(move.movedBy.name) : words.movedBy(move.movedBy.name);
}

/**
 * The project's latest activity (the picked design's card): its moves — started, moved, moved by
 * HelioGrid, moved back, undone — and the wait it opened, newest first, each with its day.
 */
export function projectEventsOf(
  project: ProjectDetailFacts,
  words: ProjectDetailWords,
  format: MarketFormat,
  chain: readonly string[],
): readonly ProjectEvent[] {
  const moves = project.journey.map((move, index): ProjectEvent & { readonly at: string } => {
    const kind = kindOf(move, chain);
    return {
      key: `move-${index}`,
      title: words.event(kind, move.to),
      line: lineOf(move, kind, words),
      on: format.date(move.enteredOn),
      at: move.movedAt,
    };
  });
  const { wait } = project;
  const opened =
    wait === null
      ? []
      : [
          {
            key: 'wait',
            title: words.event('wait', wait.party),
            line: words.reason(wait.reason),
            on: format.date(wait.startedOn),
            at: wait.openedAt,
          },
        ];
  return [...moves, ...opened]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, EVENTS_SHOWN)
    .map(({ at: _at, ...event }) => event);
}
