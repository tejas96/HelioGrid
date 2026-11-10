import { useSearchScreen } from '@heliogrid/data/react';
import { SEARCH_FIELD, searchWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { Button, SearchField, SearchResults, useFormat } from '@heliogrid/ui';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSearchMoves } from './hooks/use-search-moves';
import { styles } from './styles';

/**
 * Search on the phone (`SCR-SHELL-02`): the top bar's search opens it as a full-height sheet, the
 * field taking the keyboard at once and Cancel beside it, the results grouped under them — a
 * number read off a ringing phone is one tap from its record. What is read, drawn and reopened is
 * `useSearchScreen`'s, the web's too; the phone's own parts are the insets, the keyboard and the
 * moves.
 */
export function SearchScreen() {
  const t = useTranslate();
  const insets = useSafeAreaInsets();
  const moves = useSearchMoves();
  const screen = useSearchScreen({ pack: useFormat().pack });
  const words = searchWords(t);
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.head}>
        <View style={styles.field}>
          <SearchField
            autoFocus
            value={screen.query}
            onChange={screen.type}
            onClear={screen.clear}
            clearLabel={t(SEARCH_FIELD.clear)}
            placeholder={words.placeholder}
            ariaLabel={words.title}
          />
        </View>
        <Button variant="ghost" size="md" onClick={moves.cancel}>
          {words.cancel}
        </Button>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.results,
          { paddingBottom: insets.bottom + theme.spacing['sp-6'] },
        ]}
      >
        <SearchResults
          read={screen.read}
          searching={screen.searching}
          cursor={null}
          onOpen={moves.open}
          onReopen={screen.reopen}
          words={words}
        />
      </ScrollView>
    </View>
  );
}
