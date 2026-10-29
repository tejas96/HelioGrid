/* SourceDocument (native) — A FILE THE USER HANDED THE PRODUCT, RENDERED FOR READING. Same four
   states, same page count, same file identity, same "no preview for this kind".

   Two web mechanisms are mapped:
   · the header's `<a href>` becomes `Linking.openURL` — the same act (hand the file to the OS),
     not app navigation, and it fires alongside `onOpenOriginal` exactly as the anchor does;
   · the shimmer keyframe has no RN equivalent, so `loading` holds the page's footprint in
     --canvas-sunken. The footprint is the point: nothing reflows when the file lands. */

import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Text } from '../../primitives/Text/Text.native';
import { ReadAlongside } from './ReadAlongside.native';
import { DOCUMENT_HEIGHT, documentNameOf, documentViewOf } from './SourceDocument.logic';
import { useDocumentReading } from './SourceDocument.reading';
import type { SourceDocumentProps } from './SourceDocument.types';
import { SourceDocumentBody } from './SourceDocumentBody.native';
import { SourceDocumentHeader } from './SourceDocumentHeader.native';

interface NativeSourceDocumentProps extends SourceDocumentProps {
  style?: StyleProp<ViewStyle>;
}

export function SourceDocument({
  name,
  meta,
  pages = [],
  page,
  onPageChange,
  state = 'auto',
  height = DOCUMENT_HEIGHT,
  fit: fitProp,
  onFitChange,
  originalUrl,
  onOpenOriginal,
  openLabel,
  onRetry,
  retryLabel,
  unsupportedTitle,
  unsupportedMessage,
  failedTitle,
  failedMessage,
  emptyTitle,
  emptyMessage,
  label,
  density = 'expressive',
  words,
  style,
}: NativeSourceDocumentProps) {
  const reading = useDocumentReading({ page, onPageChange, fit: fitProp, onFitChange });
  /* The document's own frame stays while a failed file reloads, so *Try again* hands the reader
     to it. */
  const frame = useRef<View>(null);

  const view = documentViewOf(pages, reading.page, state, height);

  return (
    /* The web half is a `<section aria-label>` — a NAMED REGION — so the native half takes the
       region role (RN 0.86 parses `region`) and keeps the name on it. `accessible` does NOT go
       here: the header holds the two paging buttons, the two fit toggles and the link to the real
       file, and folding would put all five behind one element nobody could reach. The name is not
       a duplicate of the file name below it either — it is the caller's `label`, or the file name
       said as what it is ("contract.pdf — source document"), which is the whole point of naming
       a region on a screen that also shows a form. */
    <View
      ref={frame}
      role="region"
      collapsable={false}
      accessibilityLabel={documentNameOf(label, name, words)}
      style={[styles.root, style]}
    >
      <SourceDocumentHeader
        name={name}
        meta={meta}
        resolved={view.resolved}
        pageNumber={reading.page}
        count={pages.length}
        fit={reading.fit}
        onPage={reading.setPage}
        onFit={reading.setFit}
        originalUrl={originalUrl}
        onOpenOriginal={onOpenOriginal}
        openLabel={openLabel}
        words={words}
      />
      <ScrollView
        style={[
          styles.body,
          density === 'functional' ? styles.bodyFunctional : null,
          { height: view.bodyHeight },
        ]}
        contentContainerStyle={[
          styles.bodyContent,
          reading.fit === 'page' ? styles.bodyContentPage : null,
        ]}
      >
        <SourceDocumentBody
          resolved={view.resolved}
          name={name}
          page={view.page}
          pageNumber={reading.page}
          count={pages.length}
          aspect={view.aspect}
          bodyHeight={view.bodyHeight}
          fit={reading.fit}
          originalUrl={originalUrl}
          onOpenOriginal={onOpenOriginal}
          openLabel={openLabel}
          onRetry={onRetry}
          retryLabel={retryLabel}
          unsupportedTitle={unsupportedTitle}
          unsupportedMessage={unsupportedMessage}
          failedTitle={failedTitle}
          failedMessage={failedMessage}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          words={words}
          focusAfter={frame}
        />
      </ScrollView>
      {view.caption ? (
        <View style={styles.footer}>
          <Text variant="caption" color="tertiary">
            {view.caption}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

SourceDocument.Alongside = ReadAlongside;

const styles = StyleSheet.create({
  /* A viewer, not a record: a heading on the page (`F7-49`), with no fill or shadow of its own.
     Its reading area is the sunken desk the document lies on, and carries the density's radius. */
  root: { minWidth: 0, overflow: 'hidden' },
  body: { backgroundColor: theme.colors['canvas-sunken'], borderRadius: theme.radius['r-md'] },
  bodyFunctional: { borderRadius: theme.radius['r-card-functional'] },
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
