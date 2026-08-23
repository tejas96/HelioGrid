import { ImageFrame } from '../Image';
import type { ResolvedDocumentState } from './SourceDocument.logic';
import type { SourceDocumentFit, SourceDocumentPage } from './SourceDocument.types';
import { Message, PlainButton } from './SourceDocumentChrome';

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
    <PlainButton href={originalUrl} onClick={onOpenOriginal}>
      {openLabel}
    </PlainButton>
  ) : null;

  if (resolved === 'loading') {
    /* The page footprint is already the right shape — nothing reflows when the file lands. */
    return (
      <div
        role="status"
        aria-label={`Loading ${name}`}
        className="hg-source-doc-shimmer"
        style={{ width: Math.round((bodyHeight - 24) * aspect), height: bodyHeight - 24 }}
      />
    );
  }
  if (resolved === 'unsupported') {
    return <Message title={unsupportedTitle} message={unsupportedMessage} action={openAction} />;
  }
  if (resolved === 'failed') {
    /* THE STATE THAT MOST NEEDS THE SOURCE IS THE ONE THAT USED TO WITHHOLD IT. Retry first (it
       is the likelier fix), the original beside it. */
    return (
      <Message
        tone="warning"
        title={failedTitle}
        message={failedMessage}
        action={
          onRetry || canOpen ? (
            <span className="hg-source-doc-actions">
              {onRetry ? <PlainButton onClick={onRetry}>Try again</PlainButton> : null}
              {openAction}
            </span>
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
