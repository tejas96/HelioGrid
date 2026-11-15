'use client';
import type { ComposedMessage, ProjectDetail } from '@heliogrid/contracts';
import { type CrewMessageFact, crewMessageMissing, type Read } from '@heliogrid/domain';
import { useState } from 'react';
import { chatOrCopy } from './chat-or-copy';
import { useCrewMessage } from './use-proposal-hand-off';

/** Where a project's proposal rows lead, and what the device does for the crew message. */
export interface ProjectProposalMoves {
  /** The proposal's versions, where a newer one is put in force (`M08-50`). */
  toVersions(proposalId: string): void;
  openChat(message: ComposedMessage): void;
  /** `notCopied` runs when the device refuses the clipboard. */
  copy(text: string, copied: () => void, notCopied: () => void): void;
}

/** What the crew message's last copy left to say, once. */
export type CrewCopySaid = 'copied' | 'not_copied';

export interface ProjectProposalRows {
  /**
   * The version the project runs on; `null` for a deal won with no accepted proposal, which the
   * project says; `undefined` on an api built before proposals, where no row is drawn.
   */
  readonly version: ProjectDetail['proposalVersion'];
  /** A newer version exists and is not in force: the versions page offers *Put in force*. */
  readonly newerVersion: number | null;
  openVersions(): void;
  /** The evening-before installation message is due (`F5-68`): a person sends it. */
  readonly crewDue: boolean;
  /**
   * What the message still lacks while it is due — who leads, when, how long, the crew: the row
   * then asks for them and opens the installation day, never a message with holes in it.
   */
  readonly crewMissing: readonly CrewMessageFact[];
  readonly crew: {
    readonly open: boolean;
    openSheet(): void;
    close(): void;
    readonly message: Exclude<Read<ComposedMessage>, { readonly kind: 'empty' }>;
    share(message: ComposedMessage): void;
    copy(message: ComposedMessage): void;
    /** The words went to the clipboard, or the device refused it: the screen says so once. */
    readonly said: CrewCopySaid | null;
    dismissSaid(): void;
  };
}

/**
 * What a project says of its proposal (`T-M06-025`, `T-F5-002`): the version in force — or that the
 * deal was won without an accepted one — and, the evening before the installation, the composed
 * message a person sends. Nothing here sends anything, and no delivery is claimed.
 */
export function useProjectProposalRows(
  project: ProjectDetail | null,
  moves: ProjectProposalMoves,
): ProjectProposalRows {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState<CrewCopySaid | null>(null);
  const message = useCrewMessage(project?.id ?? '', open);
  const version = project?.proposalVersion;
  return {
    version,
    newerVersion: project?.newerVersion ?? null,
    openVersions: () => {
      if (version != null) moves.toVersions(version.proposalId);
    },
    crewDue: project?.crewMessageDue === true,
    crewMissing:
      project === null ? [] : crewMessageMissing(project.installation, project.crew.length),
    crew: {
      open,
      openSheet: () => setOpen(true),
      close: () => setOpen(false),
      message,
      share: (composed) =>
        chatOrCopy(moves, composed, {
          chatted: () => undefined,
          copied: () => setSaid('copied'),
          notCopied: () => setSaid('not_copied'),
        }),
      copy: (composed) =>
        moves.copy(
          composed.text,
          () => setSaid('copied'),
          () => setSaid('not_copied'),
        ),
      said,
      dismissSaid: () => setSaid(null),
    },
  };
}
