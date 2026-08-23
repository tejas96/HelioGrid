/* SourceDocument (native) — A FILE THE USER HANDED THE PRODUCT, RENDERED FOR READING. Same four
   states, same page count, same file identity, same "no preview for this kind".

   Two web mechanisms are mapped:
   · the header's `<a href>` becomes `Linking.openURL` — the same act (hand the file to the OS),
     not app navigation, and it fires alongside `onOpenOriginal` exactly as the anchor does;
   · the shimmer keyframe has no RN equivalent, so `loading` holds the page's footprint in
     --canvas-sunken. The footprint is the point: nothing reflows when the file lands. */

import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Text } from '../../primitives/Text/Text.native';
import { ReadAlongside } from './ReadAlongside.native';
import {
  currentPage,
  pageAspect,
  readingHeight,
  resolveDocumentState,
} from './SourceDocument.logic';
import { useDocumentReading } from './SourceDocument.reading';
import type { SourceDocumentProps } from './SourceDocument.types';
import { SourceDocumentBody } from './SourceDocumentBody.native';
import { SourceDocumentHeader } from './SourceDocumentHeader.native';

interface NativeSourceDocumentProps extends SourceDocumentProps {
  style?: StyleProp<ViewStyle>;
}

export function SourceDocument({
  name = 'Document',
  meta,
  pages = [],
  page,
  onPageChange,
  state = 'auto',
  height = 480,
  fit: fitProp,
  onFitChange,
  originalUrl,
  onOpenOriginal,
  openLabel = 'Open original',
  onRetry,
  unsupportedTitle = 'No preview for this file kind',
  unsupportedMessage = 'Open the original to read it.',
  failedTitle = "Couldn't load this document",
  failedMessage = "The file didn't load. Try again — if it keeps failing, upload it once more.",
  emptyTitle = 'Nothing to show yet',
  emptyMessage = 'This file has no readable pages.',
  label,
  density = 'expressive',
  style,
}: NativeSourceDocumentProps) {
  const reading = useDocumentReading({ page, onPageChange, fit: fitProp, onFitChange });

  const resolved = resolveDocumentState(state, pages.length);
  const cur = currentPage(pages, reading.page);
  const bodyH = readingHeight(height);

  return (
    /* The web half is a `<section aria-label>` — a NAMED REGION — so the native half takes the
       region role (RN 0.86 parses `region`) and keeps the name on it. `accessible` does NOT go
       here: the header holds the two paging buttons, the two fit toggles and the link to the real
       file, and folding would put all five behind one element nobody could reach. The name is not
       a duplicate of the file name below it either — it is the caller's `label`, or the file name
       said as what it is ("datasheet.pdf — source document"), which is the whole point of naming
       a region on a screen that also shows a form. */
    <View
      role="region"
      accessibilityLabel={label || `${name} — source document`}
      style={[styles.root, density === 'functional' ? styles.functional : null, style]}
    >
      <SourceDocumentHeader
        name={name}
        meta={meta}
        resolved={resolved}
        pageNumber={reading.page}
        count={pages.length}
        fit={reading.fit}
        onPage={reading.setPage}
        onFit={reading.setFit}
        originalUrl={originalUrl}
        onOpenOriginal={onOpenOriginal}
        openLabel={openLabel}
      />
      <ScrollView
        style={[styles.body, { height: bodyH }]}
        contentContainerStyle={[
          styles.bodyContent,
          reading.fit === 'page' ? styles.bodyContentPage : null,
        ]}
      >
        <SourceDocumentBody
          resolved={resolved}
          name={name}
          page={cur}
          pageNumber={reading.page}
          count={pages.length}
          aspect={pageAspect(cur)}
          bodyHeight={bodyH}
          fit={reading.fit}
          originalUrl={originalUrl}
          onOpenOriginal={onOpenOriginal}
          openLabel={openLabel}
          onRetry={onRetry}
          unsupportedTitle={unsupportedTitle}
          unsupportedMessage={unsupportedMessage}
          failedTitle={failedTitle}
          failedMessage={failedMessage}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
        />
      </ScrollView>
      {cur?.label && resolved === 'ready' ? (
        <View style={styles.footer}>
          <Text variant="caption" color="tertiary">
            {cur.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

SourceDocument.Alongside = ReadAlongside;

const styles = StyleSheet.create({
  root: {
    minWidth: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  functional: { borderRadius: theme.radius['r-card-functional'] },
  body: { backgroundColor: theme.colors['canvas-sunken'] },
  bodyContent: {
    padding: theme.spacing['sp-3'],
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 1,
  },
  bodyContentPage: { justifyContent: 'center' },
  footer: {
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
});
