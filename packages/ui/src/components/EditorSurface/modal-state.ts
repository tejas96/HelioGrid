import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { EditorSurfaceProps } from './EditorSurface.types';
import { editorStateProps } from './editor-state-props';

/** What a decision's modal hands its state body: the editor's one state block, and its read's state. */
export function modalStateOf(props: EditorSurfaceProps) {
  const { read, loadingLabel: _spokenBySkeleton, ...words } = editorStateProps(props);
  return {
    ...words,
    onRetry: retryOf(read),
    state: surfaceStateOf(read),
    variant: 'sheet' as const,
  };
}
