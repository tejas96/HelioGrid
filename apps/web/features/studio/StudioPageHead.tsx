'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { LargeTitle, PageTrail } from '@heliogrid/ui';

/**
 * A studio page's head, the app's own pattern (`CLAUDE.md` §10): the way back above the title —
 * the leads, then the lead the design hangs on once it is read; or, when the Proposals page opened
 * it, Proposals alone, so the way back returns there (`T-M05-001b`) — and the large title with its
 * one summary line.
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
  fromProposals,
  design = null,
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
  /** The Proposals page opened it: the trail is Proposals, and its press goes back there. */
  fromProposals: { readonly label: TranslatedText; readonly onOpen: () => void } | null;
  /** A started design's Site details: the design itself is the last step back. */
  design?: { readonly label: TranslatedText; readonly onOpen: () => void } | null;
}) {
  const trail =
    fromProposals === null
      ? [
          { label: leads, onOpen: onLeads },
          ...(lead === null ? [] : [{ label: lead, onOpen: onLead }]),
        ]
      : [fromProposals];
  if (design !== null) trail.push(design);
  return (
    <div className="hg-studio-head">
      <PageTrail trail={trail} here={title} label={label} narrow={!wide} />
      <LargeTitle title={title} {...(summary === null ? {} : { summary })} nameTitle />
    </div>
  );
}
