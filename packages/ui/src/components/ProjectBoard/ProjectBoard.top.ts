import {
  PROJECT_BOARD_SORTS,
  type ProjectBoardSort,
  type ProjectBoardView,
} from '@heliogrid/domain';
import type { Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import type { FilterValue } from '../FilterPanel/FilterPanel.types';
import type { ListRoom, ListTopProps } from '../ListTop/ListTop.types';
import type { ProjectBoardProps } from './ProjectBoard.types';

/** The chips' value for every stage, and the manager filter's for everyone. */
const ALL = 'all';
const MANAGER = 'manager';
const ANYONE = 'anyone';

function isSort(value: string): value is ProjectBoardSort {
  return (PROJECT_BOARD_SORTS as readonly string[]).includes(value);
}

/**
 * The board's list top (`SCR-M08-01`): the live projects with what is the person's to do and what
 * waits on others — the whole board, whatever the search — the search with the order and the
 * manager filter, and the stage chips, each with its count; the handed-over chip its last 30 days.
 */
export function projectBoardTopOf(
  props: ProjectBoardProps,
  view: ProjectBoardView,
  room: ListRoom,
  searchField: Ref<FocusHandle>,
): ListTopProps {
  const { top, words } = props;
  const stopOf = (value: string) => view.stops.find((stop) => stop.stage === value);
  /* A stage with no project is no shortcut: its chip shows only while it is the one chosen. */
  const chipStops = view.stops.filter((stop) => stop.count > 0 || stop.chosen);
  return {
    room,
    summary: {
      name: top.name,
      label: words.today(view.today),
      lead: {
        value: String(view.liveCount),
        label: top.live,
        spoken: top.liveSpoken(view.liveCount),
      },
      side: [
        {
          value: String(view.todoCount),
          label: top.toDo,
          spoken: top.toDoSpoken(view.todoCount),
          glyph: { name: 'tick', hue: 'warning' },
        },
        {
          value: String(view.waitCount),
          label: top.waiting,
          spoken: top.waitingSpoken(view.waitCount),
          glyph: { name: 'clock', hue: 'neutral' },
        },
      ],
      stages: null,
      note: view.allClear ? words.allClearTitle : null,
    },
    scope: null,
    search: {
      ref: searchField,
      value: props.searched,
      onChange: props.onSearch,
      placeholder: words.search.placeholder,
      ariaLabel: words.search.open,
      onClear: () => props.onSearch(''),
      clearLabel: words.search.clear,
    },
    sort: {
      title: top.sortTitle,
      spokenName: top.sortNamed,
      closeLabel: top.close,
      chosen: view.sort,
      choices: PROJECT_BOARD_SORTS.map((sort) => ({ key: sort, label: top.order[sort] })),
      onChoose: (key) => {
        if (isSort(key)) props.onSortBy(key);
      },
    },
    filter: {
      label: top.filters,
      activeLabel: top.filtersActive,
      on: view.manager === null ? 0 : 1,
      words: top.panel,
      closeLabel: top.close,
      resultCount: null,
      dimensions: [
        {
          kind: 'one-of',
          key: MANAGER,
          label: top.manager,
          allValue: ANYONE,
          options: [
            { value: ANYONE, label: top.anyManager },
            ...view.managers.map((one) => ({ value: one.userId, label: top.person(one.name) })),
          ],
          counts: Object.fromEntries(view.managers.map((one) => [one.userId, one.count])),
        },
      ],
      value: { [MANAGER]: view.manager ?? ANYONE },
      onChange: (value: FilterValue) => {
        const chosen = value[MANAGER];
        props.onRunBy(typeof chosen === 'string' && chosen !== ANYONE ? chosen : null);
      },
      onClear: () => props.onRunBy(null),
    },
    chips: {
      label: top.stages,
      value: view.chosen ?? ALL,
      options: [
        { value: ALL, label: top.all },
        ...chipStops.map((stop) => ({ value: stop.stage, label: words.stage(stop.stage) })),
      ],
      counts: {
        [ALL]: view.liveCount,
        ...Object.fromEntries(chipStops.map((stop) => [stop.stage, stop.count])),
      },
      onChange: (value) => props.onChooseStage(stopOf(value)?.stage ?? null),
    },
  };
}
