import type { ProjectDetail as ProjectDetailFacts } from '@heliogrid/contracts';
import type { ActivityEntry } from '../ActivityStream/ActivityStream.types';
import type { ProjectDetailWords, ProjectEventKind } from './ProjectDetail.types';

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

/**
 * What a move adds beyond who made it: the proof that moved it by itself. The person who moved it is
 * the entry's actor line, as on every timeline entry, so it is never said twice.
 */
function detailOf(move: Move, words: ProjectDetailWords): ActivityEntry['detail'] {
  return move.cause === 'proof' ? words.proofName(move.proof) : undefined;
}

/**
 * The project's latest activity as entries of the product's one timeline (`M08-17`, `M02-35`): its
 * moves — started, moved, moved by HelioGrid, moved back, undone — and the wait it opened, newest
 * first, each with its actor, drawn by the same entry the lead's timeline draws.
 */
export function projectEventsOf(
  project: ProjectDetailFacts,
  words: ProjectDetailWords,
  chain: readonly string[],
): ActivityEntry[] {
  const moves = project.journey.map((move, index): ActivityEntry => {
    const kind = kindOf(move, chain);
    const by = move.movedBy;
    return {
      id: `move-${index}`,
      kind: 'project_moved',
      at: move.movedAt,
      actorClass: move.cause === 'proof' || by === null ? 'system' : 'person',
      ...(by === null || move.cause === 'proof' ? {} : { actor: by.name }),
      summary: words.event(kind, move.to),
      ...(detailOf(move, words) === undefined ? {} : { detail: detailOf(move, words) }),
    };
  });
  const { wait } = project;
  const opened: ActivityEntry[] =
    wait === null
      ? []
      : [
          {
            id: 'wait',
            kind: 'project_wait',
            at: wait.openedAt,
            actorClass: 'person',
            actor: wait.openedBy.name,
            summary: words.event('wait', wait.party),
            detail: words.reason(wait.reason),
          },
        ];
  return [...moves, ...opened]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, EVENTS_SHOWN);
}
