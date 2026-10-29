/* StatusChip — the product's one status registry.

   It used to be a CLOSED 17-value union that selected the tone and the dot together, with a silent
   fallback that rendered an unrecognised status as a grey "Lead". Eight required vocabularies had
   none of their values in the union, so "Awaiting confirmation" had to be dressed as `negotiating`
   and "Overdue" as `lost` — a wrong semantic colour on a correct word, which is worse than either
   mistake alone.

   IT IS OPEN NOW, on both axes and separately:
     · `status` may be any string. The 17 canonical values keep their tones; anything else is a
       status the caller gives its tone.
     · `tone` is its own prop, so a caller supplies the MEANING of a word the registry has never
       heard of — "awaiting-confirmation" is a warning, "received" is a success.

   The silent fallback is gone. An unknown status with no tone renders in the neutral tone under its
   own words, not under someone else's colour.

   THE WORDS ARE THE CALLER'S. The registry holds tones only: a chip's word arrives as `label`, in
   the reader's language, so no status renders English on a Hindi or Marathi row.

   F7-12 holds throughout: this chip is always label-plus-mark, never a colour on its own — which is
   why both halves render it through the StatusMark primitive rather than re-answering it. */

import type { StatusTone } from '../../primitives/StatusMark';
import type { SolarStatus } from './StatusChip.types';

/* The canonical pipeline vocabulary. A registry, not a boundary: `tone` reaches past it. */
const STATUS_TONE: Record<SolarStatus, StatusTone> = {
  lead: 'neutral',
  'survey-scheduled': 'info',
  'design-in-progress': 'warning',
  approved: 'accent',
  installing: 'info',
  commissioned: 'success',
  'on-hold': 'danger',

  /* V2 sales stages — the leads pipeline. Same semantic palette, no new colours. */
  'new-lead': 'neutral',
  contacted: 'accent',
  qualified: 'info',
  'site-visit': 'info',
  designing: 'accent',
  'proposal-sent': 'warning',
  negotiating: 'warning',
  won: 'success',
  lost: 'danger',
  snoozed: 'neutral',
};

/** The canonical pipeline statuses, for a caller that wants to render the set. */
export const STATUS_CHIP_STATUSES = Object.keys(STATUS_TONE) as SolarStatus[];

/** The chip's tone. A caller's `tone` always wins; an unknown status is neutral. */
export function statusChipTone(status: string, tone?: StatusTone): StatusTone {
  return tone ?? STATUS_TONE[status as SolarStatus] ?? 'neutral';
}
