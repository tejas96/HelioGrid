/* StatusChip — the product's one status registry.

   It used to be a CLOSED 17-value union that selected the tone and the dot together, with a silent
   fallback that rendered an unrecognised status as a grey "Lead". Eight required vocabularies had
   none of their values in the union, so "Awaiting confirmation" had to be dressed as `negotiating`
   and "Overdue" as `lost` — a wrong semantic colour on a correct word, which is worse than either
   mistake alone.

   IT IS OPEN NOW, on both axes and separately:
     · `status` may be any string. The 17 canonical values keep their tones; anything else is a
       label the caller owns.
     · `tone` is its own prop, so a caller supplies the MEANING of a word the registry has never
       heard of — "awaiting-confirmation" is a warning, "received" is a success.

   The silent fallback is gone. An unknown status with no tone renders in the neutral tone under its
   own words, not under someone else's colour.

   F7-12 holds throughout: this chip is always label-plus-mark, never a colour on its own — which is
   why both halves render it through the StatusMark primitive rather than re-answering it. */

import type { StatusTone } from '../../primitives/StatusMark';
import type { SolarStatus } from './StatusChip.types';

interface StatusEntry {
  tone: StatusTone;
  label: string;
}

/* The canonical pipeline vocabulary. A registry, not a boundary: `tone` reaches past it. */
const STATUS: Record<SolarStatus, StatusEntry> = {
  lead: { tone: 'neutral', label: 'Lead' },
  'survey-scheduled': { tone: 'info', label: 'Survey scheduled' },
  'design-in-progress': { tone: 'warning', label: 'Design in progress' },
  approved: { tone: 'accent', label: 'Approved' },
  installing: { tone: 'info', label: 'Installing' },
  commissioned: { tone: 'success', label: 'Commissioned' },
  'on-hold': { tone: 'danger', label: 'On hold' },

  /* V2 sales stages — the leads pipeline. Same semantic palette, no new colours. */
  'new-lead': { tone: 'neutral', label: 'New lead' },
  contacted: { tone: 'accent', label: 'Contacted' },
  qualified: { tone: 'info', label: 'Qualified' },
  'site-visit': { tone: 'info', label: 'Site visit' },
  designing: { tone: 'accent', label: 'Designing' },
  'proposal-sent': { tone: 'warning', label: 'Proposal sent' },
  negotiating: { tone: 'warning', label: 'Negotiating' },
  won: { tone: 'success', label: 'Won' },
  lost: { tone: 'danger', label: 'Lost' },
  snoozed: { tone: 'neutral', label: 'Snoozed' },
};

/** The canonical pipeline statuses, for a caller that wants to render the set. */
export const STATUS_CHIP_STATUSES = Object.keys(STATUS) as SolarStatus[];

function titleCase(s: string): string {
  return String(s)
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** The tone and the words for one chip. A caller's `tone` and `label` always win. */
export function resolveStatusChip(
  status: string,
  tone?: StatusTone,
  label?: string,
): { tone: StatusTone; words: string } {
  const known = STATUS[status as SolarStatus];
  return {
    tone: tone ?? known?.tone ?? 'neutral',
    words: label || known?.label || titleCase(status),
  };
}
