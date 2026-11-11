import type { Read } from '@heliogrid/domain';
import type {
  MarkWonManager,
  MarkWonSheetDraft,
  MarkWonSheetFailure,
  MarkWonSheetProps,
} from './MarkWonSheet.types';

/** *Mark won* on a lead's screen — `useMarkWon`, by shape. */
export interface MarkWonScreen {
  readonly opened: boolean;
  readonly draft: MarkWonSheetDraft;
  readonly change: (draft: MarkWonSheetDraft) => void;
  readonly managers: Read<readonly MarkWonManager[]>;
  readonly sending: boolean;
  readonly failure: MarkWonSheetFailure | null;
  readonly started: { readonly projectId: string; readonly number: string } | null;
  readonly send: (draft: MarkWonSheetDraft) => Promise<unknown>;
  readonly close: () => void;
}

/**
 * The sheet on a lead's screen, wired once for both platforms (Law 11); the way to the project it
 * started is each platform's own.
 */
export function markWonSheetOf(
  won: MarkWonScreen,
  openProject: (projectId: string | null) => void,
  today: string,
): Omit<MarkWonSheetProps, 'words'> {
  return {
    open: won.opened,
    today,
    draft: won.draft,
    onChange: won.change,
    managers: won.managers,
    sending: won.sending,
    failure: won.failure,
    started: won.started,
    onSend: (draft) => void won.send(draft),
    onClose: won.close,
    // The sheet closes first: on Android a sheet left open draws over the project page opened under it.
    onOpenProject: () => {
      const projectId = won.started?.projectId ?? null;
      won.close();
      openProject(projectId);
    },
  };
}
