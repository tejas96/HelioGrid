import { EmptyState, FailedRead } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { projectFailedOf, projectLoadingOf } from './ProjectDetail.states';
import type { ProjectDetailStatesProps } from './ProjectDetailStates.types';

/** The project page while its project is not there: loading, failed with its retry, or gone. */
export function ProjectDetailStates({ read, words, focusAfter }: ProjectDetailStatesProps) {
  if (read.kind === 'loading') return <LoadingBars {...projectLoadingOf(words)} />;
  if (read.kind === 'failed') {
    return <FailedRead {...projectFailedOf(words, read.retry, focusAfter)} />;
  }
  return <EmptyState scene="settle" title={words.goneTitle} description={words.goneBody} />;
}
