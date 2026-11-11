import {
  LEADS_LIST_ORDERS,
  type LeadSource,
  type LeadStage,
  leadsOrderKey,
  leadsSheetFiltersOn,
  PIPELINE_STAGES,
} from '@heliogrid/domain';
import type { FilterValue } from '../FilterPanel/FilterPanel.types';
import type { ListFigure, ListTopProps } from '../ListTop/ListTop.types';
import type { LeadsListFilterBarProps } from './LeadsListFilterBar.types';

/** The chips' value for every lead, whatever the stage. */
const ALL = 'all';
const SOURCE = 'source';
const DORMANT = 'dormant';

/** The sheet's source choice for any source. */
const ANY = 'any';

const LEAD_CHIP_STAGES: readonly LeadStage[] = [...PIPELINE_STAGES, 'won'];

function isStage(value: string, stages: readonly LeadStage[]): value is LeadStage {
  return (stages as readonly string[]).includes(value);
}

/** The leads list's top, from its screen: what each part shows as set, and what each press sets. */
export function leadsListTopOf(props: LeadsListFilterBarProps): ListTopProps {
  const { screen, pipeline, words, top } = props;
  const { filters, whoseChoices } = screen;
  const counted = (stage: LeadStage) =>
    stage === 'won'
      ? pipeline.won
      : (pipeline.stages.find((one) => one.stage === stage)?.count ?? 0);
  /* A stage with no lead is no shortcut: its chip shows only while it is the one chosen. */
  const chipStages: readonly LeadStage[] = LEAD_CHIP_STAGES.filter(
    (stage) => counted(stage) > 0 || stage === filters.stage,
  );
  const side: ListFigure[] = [];
  if (screen.inboxOffered && screen.inboxWaiting !== null) {
    side.push({
      value: String(screen.inboxWaiting),
      label: top.inbox,
      spoken: top.inboxSpoken(screen.inboxWaiting),
      onPress: props.onInbox,
      glyph: { name: 'layers', hue: 'accent' },
    });
  }
  side.push({
    value: String(pipeline.dormant),
    label: top.dormant,
    spoken: top.dormantSpoken(pipeline.dormant),
    onPress: screen.toggleDormant,
    pressed: filters.dormant,
    glyph: { name: 'moon', hue: 'neutral' },
  });
  const orderLabels = [top.newest, top.billLargest, top.billSmallest, top.lastActivity];
  return {
    room: props.room,
    summary: {
      name: top.name,
      label: top.today,
      lead: {
        value: String(pipeline.open),
        label: top.open,
        spoken: top.openSpoken(pipeline.open),
      },
      side,
      note: null,
      stages: {
        form: 'band',
        stages: pipeline.stages,
        chosen: filters.stage,
        onPick: screen.pickStage,
        words: words.meter(pipeline.open),
      },
    },
    scope:
      whoseChoices.length > 1 || screen.inboxOffered
        ? {
            ariaLabel: words.whoseLabel,
            value: filters.whose,
            /* The segments are the reader's scopes and the inbox: any other value is the inbox. */
            onChange: (value) => {
              const whose = whoseChoices.find((one) => one === value);
              if (whose === undefined) props.onInbox();
              else screen.setWhose(whose);
            },
            options: words.whoseOptions(screen),
          }
        : null,
    search: {
      value: filters.query,
      onChange: screen.setQuery,
      placeholder: words.searchHint,
      ariaLabel: words.search,
      onClear: () => screen.setQuery(''),
      clearLabel: words.clearSearch,
    },
    sort: {
      title: top.sortTitle,
      spokenName: top.sortNamed,
      closeLabel: top.close,
      chosen: leadsOrderKey(filters.sort),
      choices: LEADS_LIST_ORDERS.map((order, index) => ({
        key: leadsOrderKey(order),
        label: orderLabels[index] ?? top.newest,
      })),
      onChoose: (key) => {
        const order = LEADS_LIST_ORDERS.find((one) => leadsOrderKey(one) === key);
        if (order !== undefined) screen.setSort(order);
      },
    },
    filter: {
      label: top.filters,
      activeLabel: top.filtersActive,
      on: leadsSheetFiltersOn(filters),
      words: top.panel,
      closeLabel: top.close,
      resultCount: props.matching,
      dimensions: [
        {
          kind: 'one-of',
          key: SOURCE,
          label: top.source,
          allValue: ANY,
          options: [
            { value: ANY, label: top.anySource },
            ...top.sources.map((source) => ({ value: source, label: top.sourceWord(source) })),
          ],
        },
        { kind: 'flag', key: DORMANT, label: top.dormantFilter, optionLabel: top.dormantOnly },
      ],
      value: { [SOURCE]: filters.source ?? ANY, [DORMANT]: filters.dormant },
      onChange: (value: FilterValue) => {
        const source = top.sources.find((one): one is LeadSource => one === value[SOURCE]);
        if ((source ?? null) !== filters.source) screen.setSource(source ?? null);
        if ((value[DORMANT] === true) !== filters.dormant) screen.toggleDormant();
      },
      onClear: () => {
        if (filters.source !== null) screen.setSource(null);
        if (filters.dormant) screen.toggleDormant();
      },
    },
    chips: {
      label: top.stages,
      value: filters.stage ?? ALL,
      options: [
        { value: ALL, label: top.all },
        ...chipStages.map((stage) => ({ value: stage, label: top.stage(stage) })),
      ],
      counts: {
        [ALL]: pipeline.open + pipeline.won,
        ...Object.fromEntries(chipStages.map((stage) => [stage, counted(stage)])),
      },
      onChange: (value) => {
        if (value === ALL) {
          if (filters.stage !== null) screen.pickStage(filters.stage);
        } else if (isStage(value, LEAD_CHIP_STAGES) && value !== filters.stage) {
          screen.pickStage(value);
        }
      },
    },
  };
}
