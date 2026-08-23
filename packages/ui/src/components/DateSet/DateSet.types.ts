import type { ComplianceFloorSpec } from '../ComplianceFloor/ComplianceFloor.types';
import type { ISODate } from '../DatePicker/DatePicker.types';

/** Where the date came from. **Data, not a display choice** — `F1-48` supplies the pack half. */
export type DateOrigin = 'pack' | 'tenant';

export interface DateSetEntry {
  date: ISODate;
  /** "Diwali", "Gudi Padwa", "Founder's day" — the holiday's name, not a tooltip. */
  name?: string;
  origin: DateOrigin;
  /** Tenant rows only — "Added by Priya Menon, 12 Feb 2026". Rendered after the origin word. */
  addedBy?: string;
}

/** The published answer to this component's own breakpoint (law 4). */
export interface DateSetForm {
  stacked: boolean;
  width: number;
}

export interface DateSetProps {
  entries: DateSetEntry[];
  /** A date was added. Only ever a tenant addition — `M07-12` permits extra holidays, not fewer. */
  onAdd?: (date: ISODate) => void;
  /** A **tenant** date was removed. A pack date never reaches this. */
  onRemove?: (date: ISODate) => void;
  /** The pack's name in the owner's words — "India market pack". */
  packName?: string;
  /** The floor a pack-supplied date carries. Composed from `packName` when not given. */
  floor?: ComplianceFloorSpec;
  label?: string;
  listLabel?: string;
  addLabel?: string;
  emptyMessage?: string;
  min?: ISODate;
  max?: ISODate;
  /**
   * The visible month. **Pass `onMonthChange` with it** — a pinned month draws no month arrows,
   * since arrows that write to state the view ignores are controls that lie.
   */
  month?: ISODate;
  onMonthChange?: (month: ISODate) => void;
  /**
   * The 640px breakpoint this component owns, published (law 4) — `{stacked, width}`, the same
   * callback shape `Kanban`, `DataTable` and `SheetActions` use.
   */
  onFormChange?: (form: DateSetForm) => void;
  density?: 'expressive' | 'functional';
}
