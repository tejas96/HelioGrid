import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
import { ImageFrame } from '../Image/Image.native';
import { documentBodyOf, opensOriginal } from './SourceDocument.logic';
import type { SourceDocumentBodyProps } from './SourceDocument.types';
import { Message, openOriginalFile } from './SourceDocumentChrome.native';

/**
 * The reading area itself — the page, or the words that say why there isn't one. None of the four
 * non-reading states is a spinner over a blank rectangle, and **every one of them still offers the
 * original**: a preview is never the only way to see a file.
 *
 * The shimmer keyframe has no RN equivalent, so `loading` holds the page's footprint in
 * canvas-sunken. The footprint is the point: nothing reflows when the file lands.
 */
export function SourceDocumentBody(props: SourceDocumentBodyProps) {
  const { originalUrl, onOpenOriginal, onRetry, retryLabel, focusAfter } = props;
  const view = documentBodyOf(props);
  const openAction = opensOriginal(originalUrl, onOpenOriginal) ? (
    <Button variant="secondary" size="md" onClick={openOriginalFile(originalUrl, onOpenOriginal)}>
      {props.openLabel}
    </Button>
  ) : null;

  if (view.kind === 'loading') {
    return (
      /* Web says `role="status"`; RN has no `status`, and a held footprint has no page position
         for `progressbar` to report. `accessible` makes the empty block an element so its name is
         announced, and the polite region states the same fact web's status region states. */
      <View
        accessible
        accessibilityLabel={view.label}
        accessibilityLiveRegion="polite"
        style={[styles.shimmer, view.footprint]}
      />
    );
  }
  if (view.kind === 'failed') {
    /* The state that most needs the source is the one that used to withhold it: retry first
       (the likelier fix), the original beside it. */
    return (
      <Message
        tone="warning"
        title={view.title}
        message={view.message}
        action={
          view.hasActions ? (
            <>
              <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
              {openAction}
            </>
          ) : null
        }
      />
    );
  }
  if (view.kind !== 'page') {
    return <Message title={view.title} message={view.message} action={openAction} />;
  }
  return (
    <ImageFrame
      src={view.page.url}
      alt={view.alt}
      ratio={view.ratio}
      width={view.width}
      fit="contain"
      radius={10}
      density="functional"
      missingReason="unavailable"
      onRetry={onRetry}
      retryLabel={retryLabel}
      words={props.words.image}
    />
  );
}

const styles = StyleSheet.create({
  shimmer: { borderRadius: 10, backgroundColor: theme.colors['canvas-sunken'] },
});
