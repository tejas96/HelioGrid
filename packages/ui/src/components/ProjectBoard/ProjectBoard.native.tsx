import type { ProjectBoardView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { ListTop } from '../ListTop/ListTop.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { searchMissed } from './ProjectBoard.logic';
import { projectBoardTopOf } from './ProjectBoard.top';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardNeeds } from './ProjectBoardNeeds.native';
import { ProjectBoardNoMatch } from './ProjectBoardNoMatch.native';
import { ProjectBoardStages } from './ProjectBoardStages.native';

/**
 * The board on the phone (`SCR-M08-01`): the large title, the list top every list page shares —
 * the summary, the search with the order and the manager filter, the stage chips — then *To do*,
 * *Waiting* and every project by stage, each its own card.
 */
export function ProjectBoard(props: ProjectBoardProps) {
  const field = useRef<FocusHandle>(null);
  return (
    <View style={styles.board}>
      <View>{props.head}</View>
      <BoardBody {...props} field={field} />
    </View>
  );
}

type BodyProps = ProjectBoardProps & { field: RefObject<FocusHandle | null> };

/** The board under its title: its read's loading, failure and first run, or the board itself. */
function BoardBody(props: BodyProps) {
  const { read, words, focusAfter } = props;
  if (read.kind === 'loading') return <LoadingBars {...projectLoadingOf(words)} />;
  if (read.kind === 'failed') {
    return <FailedRead {...projectFailedOf(words, read.retry, focusAfter)} />;
  }
  if (read.kind === 'empty') {
    return <EmptyState scene="settle" title={words.emptyTitle} description={words.emptyBody} />;
  }
  return <Board view={read.value} {...props} />;
}

function Board(props: BodyProps & { view: ProjectBoardView }) {
  const { view, field } = props;
  return (
    <>
      <ListTop {...projectBoardTopOf(props, view, 'narrow', field)} />
      <ProjectBoardNeeds {...props} />
      {searchMissed(view) ? (
        <ProjectBoardNoMatch {...props} searchField={field} />
      ) : (
        <ProjectBoardStages {...props} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  board: { gap: theme.spacing['sp-6'] },
});
