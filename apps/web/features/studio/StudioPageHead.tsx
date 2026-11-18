'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { LargeTitle, PageTrail } from '@heliogrid/ui';

/**
 * A studio page's head, the app's own pattern (`CLAUDE.md` §10): the way back above the title —
 * the leads, then the lead the design hangs on once it is read — and the large title with its one
 * summary line.
 */
export function StudioPageHead({
  wide,
  label,
  leads,
  lead,
  title,
  summary,
  onLeads,
  onLead,
}: {
  wide: boolean;
  /** The trail's name. */
  label: TranslatedText;
  leads: TranslatedText;
  /** The lead as the trail names it — its customer; `null` until the design is read. */
  lead: TranslatedText | null;
  title: TranslatedText;
  summary: TranslatedText | null;
  onLeads: () => void;
  onLead: () => void;
}) {
  const trail = [
    { label: leads, onOpen: onLeads },
    ...(lead === null ? [] : [{ label: lead, onOpen: onLead }]),
  ];
  return (
    <div className="hg-studio-head">
      <PageTrail trail={trail} here={title} label={label} narrow={!wide} />
      <LargeTitle title={title} {...(summary === null ? {} : { summary })} nameTitle />
    </div>
  );
}
