import type { NotificationType, NotificationTypeGroup } from '@heliogrid/domain';
import { useState } from 'react';
import type { NotificationListRow } from './NotificationCard.types';

/**
 * Which mark each notification type wears (`SCR-SHELL-03`), drawn from the activity glyphs so a
 * shape is outlined once. `system` has none: product news wears the product's own tile.
 */
const GLYPH_BY_TYPE: Record<Exclude<NotificationType, 'system'>, string> = {
  proposal_opened: 'eye',
  agent_escalation: 'phone',
  follow_up_due: 'clock',
  survey_submitted: 'calendar-check',
  design_returned: 'grid',
  signoff_requested: 'check',
  payment_due: 'rupee',
  lead_unassigned_24h: 'user-plus',
};

/** The bell for a type this build does not know yet — never an empty circle. */
export function notificationGlyph(type: string): string {
  return (GLYPH_BY_TYPE as Record<string, string | undefined>)[type] ?? 'bell';
}

/** A row's key in the list: a group by its key, any other row by its record. */
export function notificationRowKey<T extends { id: string }>(row: NotificationListRow<T>): string {
  return row.kind === 'group' ? row.key : row.item.id;
}

/** Which groups the reader opened — a purely visual fact the list holds for both halves. */
export function useOpenGroups(): {
  isOpen: (key: string) => boolean;
  toggle: (key: string) => void;
} {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((was) => {
      const next = new Set(was);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  return { isOpen: (key) => open.has(key), toggle };
}

/** Each type group's icon in the filter bar, drawn from the activity glyphs. */
const GROUP_GLYPH: Record<NotificationTypeGroup, string> = {
  sales: 'bar-chart',
  delivery: 'calendar-check',
  payments: 'rupee',
  team: 'users',
  billing: 'bill',
};

/** A group this build does not know still gets a mark — the dot, never an empty button. */
export function groupGlyph(group: string): string {
  return (GROUP_GLYPH as Record<string, string | undefined>)[group] ?? 'dot';
}
