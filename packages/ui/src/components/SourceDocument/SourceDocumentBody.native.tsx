import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { ImageFrame } from '../Image/Image.native';
import type { ResolvedDocumentState } from './SourceDocument.logic';
import type { SourceDocumentFit, SourceDocumentPage } from './SourceDocument.types';
import { Message, openOriginalFile, PlainButton } from './SourceDocumentChrome.native';

export interface SourceDocumentBodyProps {
  resolved: ResolvedDocumentState;
  name: string;
  page: SourceDocumentPage | null;
  /** Zero-based; the reader is shown `pageNumber + 1`. */
  pageNumber: number;
  count: number;
  aspect: number;
  bodyHeight: number;
  fit: SourceDocumentFit;
  originalUrl?: string;
  onOpenOriginal?: () => void;
  openLabel: string;
  onRetry?: () => void;
  unsupportedTitle: string;
  unsupportedMessage: string;
  failedTitle: string;
  failedMessage: string;
  emptyTitle: string;
  emptyMessage: string;
}

/**
 * The reading area itself — the page, or the words that say why there isn't one. None of the four
 * non-reading states is a spinner over a blank rectangle, and **every one of them still offers the
 * original**: a preview is never the only way to see a file.
 *
 * The shimmer keyframe has no RN equivalent, so `loading` holds the page's footprint in
 * canvas-sunken. The footprint is the point: nothing reflows when the file lands.
 */
export function SourceDocumentBody({
  resolved,
  name,
  page,
  pageNumber,
  count,
  aspect,
  bodyHeight,
  fit,
  originalUrl,
  onOpenOriginal,
  openLabel,
  onRetry,
  unsupportedTitle,
  unsupportedMessage,
  failedTitle,
  failedMessage,
  emptyTitle,
  emptyMessage,
}: SourceDocumentBodyProps) {
  const canOpen = Boolean(originalUrl || onOpenOriginal);
  const openAction = canOpen ? (
    <PlainButton onPress={openOriginalFile(originalUrl, onOpenOriginal)}>{openLabel}</PlainButton>
  ) : null;

  if (resolved === 'loading') {
    return (
      /* Web says `role="status"`; RN has no `status`, and a held footprint has no page position
         for `progressbar` to report. `accessible` makes the empty block an element so its name is
         announced, and the polite region states the same fact web's status region states. */
      <View
        accessible
        accessibilityLabel={`Loading ${name}`}
        accessibilityLiveRegion="polite"
        style={[
          styles.shimmer,
          { width: Math.round((bodyHeight - 24) * aspect), height: bodyHeight - 24 },
        ]}
      />
    );
  }
  if (resolved === 'unsupported') {
    return <Message title={unsupportedTitle} message={unsupportedMessage} action={openAction} />;
  }
  if (resolved === 'failed') {
    /* The state that most needs the source is the one that used to withhold it: retry first
       (the likelier fix), the original beside it. */
    return (
      <Message
        tone="warning"
        title={failedTitle}
        message={failedMessage}
        action={
          onRetry || canOpen ? (
            <>
              {onRetry ? <PlainButton onPress={onRetry}>Try again</PlainButton> : null}
              {openAction}
            </>
          ) : null
        }
      />
    );
  }
  if (resolved === 'empty' || page === null) {
    return <Message title={emptyTitle} message={emptyMessage} action={openAction} />;
  }
  return (
    <ImageFrame
      src={page.url}
      alt={page.label || `${name}, page ${pageNumber + 1} of ${count}`}
      ratio={`${aspect}`}
      width={fit === 'page' ? Math.round((bodyHeight - 24) * aspect) : '100%'}
      fit="contain"
      radius={10}
      density="functional"
      missingReason="unavailable"
      onRetry={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  shimmer: { borderRadius: 10, backgroundColor: theme.colors['canvas-sunken'] },
});
