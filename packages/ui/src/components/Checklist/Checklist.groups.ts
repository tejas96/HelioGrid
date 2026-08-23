import type { ChecklistItem, ChecklistPhase } from './Checklist.types';

/** The key a phase-less item groups under. Never rendered as a heading. */
export const NO_PHASE = '__none';

export interface ChecklistGroup {
  key: string;
  /** The heading's words — the phase's own `label`, or the raw key when no `phases` was given. */
  heading: string;
  note: ChecklistPhase['note'];
  items: ChecklistItem[];
  doneCount: number;
}

export interface ChecklistModel {
  list: ChecklistItem[];
  done: number;
  /** 0–100. */
  percent: number;
  groups: ChecklistGroup[];
  numberFor: (item: ChecklistItem) => string | number;
}

/**
 * **Grouping, not change-detection.** Each phase heading exists exactly once because it is drawn
 * from a group — a phase cannot appear twice ten rows apart, which is what makes `MS11-30`
 * structurally impossible rather than merely discouraged. Order is the `phases` order when given,
 * first appearance otherwise.
 *
 * **Numbering is counted:** an item's number is its position in the whole list, so no second count
 * can disagree with it.
 */
export function buildChecklist(
  items: ChecklistItem[],
  phases: ChecklistPhase[] | undefined,
): ChecklistModel {
  const list = items.filter((item): item is ChecklistItem => Boolean(item));
  const done = list.filter((item) => item.done === true).length;
  const percent = list.length === 0 ? 0 : (done / list.length) * 100;

  const numbers = new Map<ChecklistItem, string | number>(
    list.map((item, index) => [item, item.number ?? index + 1]),
  );

  const order: string[] = [];
  const buckets = new Map<string, ChecklistItem[]>();
  const meta = new Map<string, ChecklistPhase>();

  for (const phase of phases ?? []) {
    const key = phase.id ?? phase.label;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    meta.set(key, phase);
  }

  for (const item of list) {
    const key = item.phase ?? NO_PHASE;
    let bucket = buckets.get(key);
    if (bucket === undefined) {
      bucket = [];
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.push(item);
  }

  const groups: ChecklistGroup[] = [];
  for (const key of order) {
    const bucket = buckets.get(key);
    if (bucket === undefined || bucket.length === 0) continue;
    const phase = meta.get(key);
    groups.push({
      key,
      heading: phase?.label ?? key,
      note: phase?.note,
      items: bucket,
      doneCount: bucket.filter((item) => item.done === true).length,
    });
  }

  return {
    list,
    done,
    percent,
    groups,
    numberFor: (item) => numbers.get(item) ?? '',
  };
}
