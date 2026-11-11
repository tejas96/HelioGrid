import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { projectFailedOf, projectLoadingOf } from './ProjectDetail.states';
import type { ProjectDetailStatesProps } from './ProjectDetailStates.types';

/** The project page on the phone while its project is not there: loading, failed, or gone. */
export function ProjectDetailStates({ read, words, focusAfter }: ProjectDetailStatesProps) {
  if (read.kind === 'loading') return <LoadingBars {...projectLoadingOf(words)} />;
  if (read.kind === 'failed') {
    return <FailedRead {...projectFailedOf(words, read.retry, focusAfter)} />;
  }
  return <EmptyState scene="settle" title={words.goneTitle} description={words.goneBody} />;
}
