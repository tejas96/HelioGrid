import type { ProjectBoardView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusAfter, FocusHandle } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { projectFailedOf, projectLoadingOf } from '../ProjectDetail/ProjectDetail.states';
import { SearchField } from '../SearchField/SearchField.native';
import { searchMissed } from './ProjectBoard.logic';
import type { ProjectBoardProps } from './ProjectBoard.types';
import { ProjectBoardHero } from './ProjectBoardHero.native';
import { ProjectBoardNeeds } from './ProjectBoardNeeds.native';
import { ProjectBoardNoMatch } from './ProjectBoardNoMatch.native';
import { ProjectBoardStages } from './ProjectBoardStages.native';

/**
 * The board on the phone (`SCR-M08-01`, the picked phone frames): the title with the search glyph,
 * which opens the search field above the lists; the hero; *To do*; *Waiting*; then every project by
 * stage under one stage pill that opens the stages as a sheet.
 */
export function ProjectBoard(props: ProjectBoardProps) {
  const { read, head, searched, onSearch, words } = props;
  const field = useRef<FocusHandle>(null);
  const [searching, setSearching] = useState(searched !== '');
  const ready = read.kind === 'ready';
  const toggleSearch = () => {
    if (searching) onSearch('');
    setSearching(!searching);
  };
  return (
    <View style={styles.board}>
      <View style={styles.top}>
        <View style={styles.title}>{head}</View>
        {ready ? (
          <IconButton label={words.search.open} pressed={searching} onClick={toggleSearch}>
            <ShellGlyph name="search" size="md" tone="primary" />
          </IconButton>
        ) : null}
      </View>
      {ready && searching ? (
        <SearchField
          ref={field}
          autoFocus
          value={searched}
          onChange={onSearch}
          placeholder={words.search.placeholder}
          onClear={() => onSearch('')}
          clearLabel={words.search.clear}
        />
      ) : null}
      <BoardBody {...props} searchField={field} />
    </View>
  );
}

/** The board under its title: its read's loading, failure and first run, or the board itself. */
function BoardBody(props: ProjectBoardProps & { searchField: FocusAfter }) {
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

function Board(props: ProjectBoardProps & { view: ProjectBoardView; searchField: FocusAfter }) {
  const { view } = props;
  return (
    <>
      <ProjectBoardHero view={view} words={props.words} />
      <ProjectBoardNeeds {...props} />
      {searchMissed(view) ? <ProjectBoardNoMatch {...props} /> : <ProjectBoardStages {...props} />}
    </>
  );
}

const styles = StyleSheet.create({
  board: { gap: theme.spacing['sp-6'] },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  title: { flex: 1, minWidth: 0 },
});
