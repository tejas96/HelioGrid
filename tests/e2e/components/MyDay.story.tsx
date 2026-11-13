import type { MyDay as Day, MyDayItem } from '@heliogrid/contracts';
import type { CallOutcome, MyDayBand } from '@heliogrid/domain';
import { createTranslator, myDayWords, provenanceWords } from '@heliogrid/i18n';
import { MyDay, type MyDayBandRows, ProvenanceWordsProvider } from '@heliogrid/ui';
import { itemOf, SEEDS, type Seed } from '../support/my-day';

const en = await createTranslator('en');
const WORDS = myDayWords(en.t);

export interface MyDayStoryProps {
  readonly state: 'day' | 'asking' | 'clear' | 'failed' | 'loading';
  readonly sending?: boolean;
  readonly failed?: boolean;
  readonly onCall?: (taskId: string) => void;
  readonly onDirections?: (taskId: string) => void;
  readonly onDone?: (taskId: string) => void;
  readonly onMove?: (taskId: string) => void;
  readonly onOpen?: (taskId: string) => void;
  readonly onExpand?: (band: MyDayBand) => void;
  readonly onAnswer?: (outcome: CallOutcome) => void;
  readonly onRetry?: () => void;
  /** The hero's task, when the spec needs another than the day's own. */
  readonly nextSeed?: Seed;
}

const counts = { overdue: 14, today: 3, week: 6, doneToday: 3 };

/** My Day as the home holds it: a salesperson's day in Pune, the read in the state the spec asks. */
export function MyDayStory(props: MyDayStoryProps) {
  const next = itemOf(props.nextSeed ?? SEEDS.next);
  const rows = (seeds: readonly Seed[]) => seeds.map(itemOf);
  const clear = props.state === 'clear';
  const bands: MyDayBandRows[] = clear
    ? []
    : [
        { band: 'overdue', count: counts.overdue, rows: rows(SEEDS.overdue), hidden: 11 },
        { band: 'today', count: counts.today, rows: rows(SEEDS.today), hidden: 0 },
        { band: 'week', count: counts.week, rows: rows(SEEDS.week), hidden: 5 },
      ];
  const value: Day = {
    today: new Date().toISOString().slice(0, 10),
    timeZone: 'Asia/Kolkata',
    currencyCode: 'INR',
    nextTaskId: clear ? null : next.task.id,
    items: clear ? [] : [next],
    counts: clear ? { overdue: 0, today: 0, week: 0, doneToday: 3 } : counts,
  } as Day;
  const read =
    props.state === 'loading'
      ? ({ kind: 'loading' } as const)
      : props.state === 'failed'
        ? ({ kind: 'failed', failure: 'no_connection', retry: () => props.onRetry?.() } as const)
        : ({ kind: 'ready', value } as const);
  const id = (item: MyDayItem) => item.task.id;
  return (
    <ProvenanceWordsProvider value={provenanceWords(en.t)}>
      <MyDay
        read={read}
        words={WORDS}
        next={clear ? null : next}
        bands={bands}
        asking={props.state === 'asking' ? next : null}
        sending={props.sending ?? false}
        failed={props.failed ?? false}
        focusAfter={{ current: null }}
        onExpand={(band) => props.onExpand?.(band)}
        onOpen={(item) => props.onOpen?.(id(item))}
        onCall={(item) => props.onCall?.(id(item))}
        onMessage={() => undefined}
        onDirections={(item) => props.onDirections?.(id(item))}
        onDone={(item) => props.onDone?.(id(item))}
        onMoveToTomorrow={(item) => props.onMove?.(id(item))}
        onAnswer={(outcome) => props.onAnswer?.(outcome)}
        onSkipAnswer={() => undefined}
      />
    </ProvenanceWordsProvider>
  );
}
