import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { CardRows } from '../CardRows/CardRows.native';
import type { ProjectBoardProps } from './ProjectBoard.types';

/** A search that finds no project, on the phone: what was searched, and the way to clear it. */
export function ProjectBoardNoMatch({
  words,
  searched,
  onSearch,
  searchField,
}: Pick<ProjectBoardProps, 'words' | 'searched' | 'onSearch'> & { searchField: FocusAfter }) {
  const leaving = useFocusAfter(searchField);
  return (
    <CardRows>
      <View style={styles.box}>
        <Text variant="body" align="center">
          {words.search.noMatch(searched)}
        </Text>
        <Button variant="secondary" size="sm" onClick={leaving(() => onSearch(''))}>
          {words.search.clear}
        </Button>
      </View>
    </CardRows>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: theme.spacing['sp-3'], padding: theme.spacing['sp-5'] },
});
