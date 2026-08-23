import { theme } from '@heliogrid/theme';
import { Pressable as RNPressable, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text.native';
import type { ResolvedDocumentState } from './SourceDocument.logic';
import type { SourceDocumentFit } from './SourceDocument.types';
import { Chrome, IconBtn, openOriginalFile } from './SourceDocumentChrome.native';

export interface SourceDocumentHeaderProps {
  name: string;
  meta?: string;
  resolved: ResolvedDocumentState;
  /** Zero-based; the reader is shown `pageNumber + 1`. */
  pageNumber: number;
  count: number;
  fit: SourceDocumentFit;
  onPage: (n: number) => void;
  onFit: (f: SourceDocumentFit) => void;
  originalUrl?: string;
  onOpenOriginal?: () => void;
  openLabel: string;
}

/**
 * The file's identity and everything you can do to it while it is readable: which page you are on
 * and how it is fitted, plus the route to the real file. The paging controls hold the 44dp floor
 * and the count is announced politely, because moving a page is the reviewer's main act here.
 */
export function SourceDocumentHeader({
  name,
  meta,
  resolved,
  pageNumber,
  count,
  fit,
  onPage,
  onFit,
  originalUrl,
  onOpenOriginal,
  openLabel,
}: SourceDocumentHeaderProps) {
  const paged = resolved === 'ready' && count > 0;
  const canOpen = Boolean(originalUrl || onOpenOriginal);

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
      {paged ? (
        <Chrome>
          <IconBtn
            label="Previous page"
            path="m15 18-6-6 6-6"
            disabled={pageNumber <= 0}
            onPress={() => onPage(pageNumber - 1)}
          />
          {/* The web half's `aria-live="polite"`: Previous/Next changes this number and nothing
              else on screen, so a reader that is not told is a reader that moved a page blind. */}
          <View accessibilityLiveRegion="polite" style={styles.count}>
            <Text variant="caption" color="secondary" style={styles.countWord}>
              {`${pageNumber + 1} / ${count}`}
            </Text>
          </View>
          <IconBtn
            label="Next page"
            path="m9 18 6-6-6-6"
            disabled={pageNumber >= count - 1}
            onPress={() => onPage(pageNumber + 1)}
          />
        </Chrome>
      ) : null}
      {paged ? (
        <Chrome>
          <IconBtn
            label="Fit width"
            pressed={fit === 'width'}
            path="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"
            onPress={() => onFit('width')}
          />
          <IconBtn
            label="Fit whole page"
            pressed={fit === 'page'}
            path="M5 4h14v16H5zM9 9h6v6H9z"
            onPress={() => onFit('page')}
          />
        </Chrome>
      ) : null}
      {canOpen && resolved === 'ready' ? (
        <RNPressable
          accessibilityRole="link"
          onPress={openOriginalFile(originalUrl, onOpenOriginal)}
          style={styles.open}
        >
          <Text variant="body-sm" style={styles.openWord}>
            {openLabel}
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
