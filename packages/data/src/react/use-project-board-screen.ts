'use client';
import {
  can,
  handedOverSince,
  offersDoor,
  PROJECT_BOARD_FIRST_SORT,
  type ProjectBoardSort,
  type ProjectBoardView,
  type ProjectChainStage,
  projectBoardViewOf,
  type Read,
  shellViewFor,
  type TodoRow,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { useSession } from './use-session';

/** The handed-over stop's list: one page, the most a month of handovers fills (the api's cap). */
const HANDED_OVER_PAGE = 100;

/** What a project page opens asking: an early proof's own sheet (`useProjectScreen`). */
export type ProjectAsk = 'earlyProof';

/** Where a to-do row's act goes: its project, with what the page asks first. */
export interface TodoAnswer {
  readonly projectId: string;
  readonly ask: ProjectAsk | null;
}

export interface ProjectBoardScreen {
  /** The board is a door this person's presets open (`F7-48`); else the screen is not theirs. */
  readonly allowed: boolean;
  readonly read: Read<ProjectBoardView>;
  readonly choose: (stage: ProjectChainStage | null) => void;
  /** What is typed in the board's search; blank shows every project. */
  readonly searched: string;
  readonly search: (text: string) => void;
  /** How the list of projects is ordered — longest in its stage first until changed. */
  readonly sortBy: (sort: ProjectBoardSort) => void;
  /** One manager's projects by user id, or everyone's (`null`). */
  readonly runBy: (manager: string | null) => void;
  /**
   * A to-do row's act opens its project. An early proof opens it asking in its own sheet — the
   * stages it passes over shown before the one tap that moves it — never moved from the board.
   */
  readonly todo: (row: TodoRow) => TodoAnswer;
}

/**
 * The board (`SCR-M08-01`) as both screens draw it, assembled once (Law 11): every live project the
 * person reaches, *To do*, *Waiting* and the stages — `projectBoardViewOf`'s view of the one read.
 * A board with no project at all, at any stage, is empty: the first-run teaches Mark won.
 */
export function useProjectBoardScreen(): ProjectBoardScreen {
  const { user, chosenHome } = useSession();
  const repositories = useRepositories();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles ?? [];
  const allowed = offersDoor(shellViewFor(roles, chosenHome), 'projects');
  const canAct = can(roles, 'projects.update_stages');
  const [chosen, setChosen] = useState<ProjectChainStage | null>(null);
  const [searched, setSearched] = useState('');
  const [sort, setSort] = useState<ProjectBoardSort>(PROJECT_BOARD_FIRST_SORT);
  const [manager, setManager] = useState<string | null>(null);
  const board = useQuery({
    queryKey: queryKeys.projects.board(tenantId),
    queryFn: ({ signal }) => repositories.projects.board(signal),
    enabled: tenantId !== '' && allowed,
  });
  const today = board.data?.today ?? null;
  // The handed-over stop lists the projects it counts: the last 30 days, read when chosen.
  const handedOver = useQuery({
    queryKey: queryKeys.projects.handedOver(tenantId),
    queryFn: ({ signal }) =>
      repositories.projects.closed(
        {
          stage: 'handed_over',
          since: handedOverSince(today ?? ''),
          page: 1,
          limit: HANDED_OVER_PAGE,
        },
        signal,
      ),
    enabled: tenantId !== '' && allowed && chosen === 'handed_over' && today !== null,
  });
  const read = readOf(board, (value) => value.stages.every((stage) => stage.count === 0));
  return {
    allowed,
    read:
      read.kind === 'ready'
        ? {
            kind: 'ready',
            value: projectBoardViewOf(read.value, {
              stage: chosen,
              searched,
              canAct,
              handedOver: handedOver.data?.items ?? null,
              sort,
              manager,
            }),
          }
        : read,
    choose: setChosen,
    searched,
    search: setSearched,
    sortBy: setSort,
    runBy: setManager,
    todo: (row) => ({
      projectId: row.card.id,
      ask: row.kind === 'proof_early' && row.card.earlyProofTo !== null ? 'earlyProof' : null,
    }),
  };
}
