import type { ReactNode } from 'react';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type { EditorSurfaceProps } from './EditorSurface.types';

/** The five-state block every form of the editor takes, unchanged, straight through. */
export interface EditorStateProps {
  state?: SurfaceState;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  unavailableTitle?: string;
  unavailableMessage?: string;
  unavailableAction?: ReactNode;
}

/**
 * The system's five (`SurfaceState`) pass through the switch untouched: an editor is a surface, so
 * `unavailable` stays neutral with no retry, and `empty` still invites, whichever form renders.
 *
 * Bundled in one place because `Sheet` and `DetailPanel` both take the whole block and repeating
 * ten prop lines twice per platform is how a state quietly goes missing from one of the forms.
 */
export function editorStateProps(props: EditorSurfaceProps): EditorStateProps {
  return {
    state: props.state,
    errorTitle: props.errorTitle,
    errorMessage: props.errorMessage,
    onRetry: props.onRetry,
    emptyTitle: props.emptyTitle,
    emptyMessage: props.emptyMessage,
    emptyAction: props.emptyAction,
    unavailableTitle: props.unavailableTitle,
    unavailableMessage: props.unavailableMessage,
    unavailableAction: props.unavailableAction,
  };
}
