import { RetryButton } from '../Button/RetryButton';
import { ImageFrame } from '../Image';
import { documentBodyOf, opensOriginal } from './SourceDocument.logic';
import type { SourceDocumentBodyProps } from './SourceDocument.types';
import { Message, OpenOriginal } from './SourceDocumentChrome';

/**
 * The reading area itself — the page, or the words that say why there isn't one. None of the four
 * non-reading states is a spinner over a blank rectangle, and **every one of them still offers the
 * original**: a preview is never the only way to see a file.
 */
export function SourceDocumentBody(props: SourceDocumentBodyProps) {
  const { originalUrl, onOpenOriginal, onRetry, retryLabel, focusAfter } = props;
  const view = documentBodyOf(props);
  const openAction = opensOriginal(originalUrl, onOpenOriginal) ? (
    <OpenOriginal href={originalUrl} onClick={onOpenOriginal}>
      {props.openLabel}
    </OpenOriginal>
  ) : null;

  if (view.kind === 'loading') {
    /* The page footprint is already the right shape — nothing reflows when the file lands. */
    return (
      <div
        role="status"
        aria-label={view.label}
        className="hg-source-doc-shimmer"
        style={view.footprint}
      />
    );
  }
  if (view.kind === 'failed') {
    /* THE STATE THAT MOST NEEDS THE SOURCE IS THE ONE THAT USED TO WITHHOLD IT. Retry first (it
       is the likelier fix), the original beside it. */
    return (
      <Message
        tone="warning"
        title={view.title}
        message={view.message}
        action={
          view.hasActions ? (
            <span className="hg-source-doc-actions">
              <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
              {openAction}
            </span>
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
