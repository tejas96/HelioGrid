'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { IconButton, LargeTitle, PageTrail, ShellGlyph } from '@heliogrid/ui';

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
  out = null,
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
  /**
   * A started design in a narrow room, whose one way back is the studio: the lead — or Proposals,
   * when they opened it — as a round act at the row's end, so the page still leads out of the design.
   */
  out?: {
    readonly label: TranslatedText;
    readonly glyph: 'user' | 'document';
    readonly onOpen: () => void;
  } | null;
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
      <PageTrail
        trail={trail}
        here={title}
        label={label}
        narrow={!wide}
        {...(wide || out === null
          ? {}
          : {
              acts: (
                <IconButton label={out.label} variant="ghost" onClick={out.onOpen}>
                  <ShellGlyph name={out.glyph} size="md" />
                </IconButton>
              ),
            })}
      />
      <LargeTitle title={title} {...(summary === null ? {} : { summary })} nameTitle />
    </div>
  );
}
