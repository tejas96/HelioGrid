import { theme } from '@heliogrid/theme';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import { documentHeaderOf } from './SourceDocument.logic';
import type { SourceDocumentHeaderProps } from './SourceDocument.types';
import { Chrome, IconBtn, openOriginalFile } from './SourceDocumentChrome.native';

/**
 * The file's identity and everything you can do to it while it is readable: which page you are on
 * and how it is fitted, plus the route to the real file. The paging controls hold the 44dp floor
 * and the count is announced politely, because moving a page is the reviewer's main act here.
 */
export function SourceDocumentHeader(props: SourceDocumentHeaderProps) {
  const { name, meta, pageNumber, fit, onPage, onFit, originalUrl, onOpenOriginal, words } = props;
  const header = documentHeaderOf(props);

  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <Text variant="body-sm" style={styles.name}>
          {name}
        </Text>
        {meta ? (
          <Text variant="caption" color="tertiary">
            {meta}
          </Text>
        ) : null}
      </View>
      {header.paged ? (
        <Chrome>
          <IconBtn
            label={words.previousPage}
            glyph="chevron-left"
            disabled={header.atFirst}
            onPress={() => onPage(pageNumber - 1)}
          />
          {/* The web half's `aria-live="polite"`: Previous/Next changes this number and nothing
              else on screen, so a reader that is not told is a reader that moved a page blind. */}
          <View accessibilityLiveRegion="polite" style={styles.count}>
            <Text variant="caption" color="secondary" style={styles.countWord}>
              {header.position}
            </Text>
          </View>
          <IconBtn
            label={words.nextPage}
            glyph="chevron-right"
            disabled={header.atLast}
            onPress={() => onPage(pageNumber + 1)}
          />
        </Chrome>
      ) : null}
      {header.paged ? (
        <Chrome>
          <IconBtn
            label={words.fitWidth}
            pressed={fit === 'width'}
            glyph="fit-width"
            onPress={() => onFit('width')}
          />
          <IconBtn
            label={words.fitPage}
            pressed={fit === 'page'}
            glyph="fit-page"
            onPress={() => onFit('page')}
          />
        </Chrome>
      ) : null}
      {header.showsOpen ? (
        <RNPressable
          accessibilityRole="link"
          onPress={openOriginalFile(originalUrl, onOpenOriginal)}
          style={styles.open}
        >
          <Text variant="body-sm" style={styles.openWord}>
            {props.openLabel}
          </Text>
        </RNPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingLeft: theme.spacing['sp-4'],
    paddingRight: theme.spacing['sp-2'],
    minWidth: 0,
  },
  identity: { flex: 1, minWidth: 0 },
  name: { fontFamily: theme.type.families.mono, fontWeight: '500' },
  count: { minWidth: 62, alignItems: 'center' },
  countWord: { fontFamily: theme.type.families.mono, textAlign: 'center' },
  open: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  openWord: { fontWeight: '500', color: theme.colors.accent },
});
