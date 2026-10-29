import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import type { PagedDocumentWords, PageGeometry } from './PagedDocument.types';
import { PrintScope } from './PrintScope';

export interface AnnotationItem {
  id: string;
  label?: TranslatedText;
  content?: ReactNode;
}

/** Saved, and not printed. Canvas-coloured and labelled, so it never reads as part of the paper. */
export function Annotations({
  items,
  words,
  width,
  web,
}: {
  items: AnnotationItem[];
  words: Pick<PagedDocumentWords, 'internalNote' | 'savedNotPrinted'>;
  width?: number;
  web?: boolean;
}) {
  return (
    <PrintScope
      only="screen"
      className="hg-paged-document-annotations"
      style={{ width: web ? '100%' : width }}
    >
      {items.map((a) => (
        <div key={a.id} className="hg-paged-document-annotation">
          <p className="hg-paged-document-annotation-label">
            {words.savedNotPrinted(a.label || words.internalNote)}
          </p>
          {a.content}
        </div>
      ))}
    </PrintScope>
  );
}

export function InternalStamp({ stamp, web }: { stamp: TranslatedText; web?: boolean }) {
  return (
    <p className="hg-paged-document-stamp" data-web={web ? 'true' : undefined}>
      {stamp}
    </p>
  );
}

/** The pending cut's placeholder sheet, a busy region named by what it is doing. */
export function SheetSkeleton({
  geometry,
  name,
}: {
  geometry: PageGeometry;
  name: TranslatedText;
}) {
  return (
    <div
      role="status"
      aria-label={name}
      className="hg-paged-document-skeleton"
      style={{ width: geometry.width, height: geometry.height, padding: geometry.margin.top }}
    >
      <div className="hg-paged-document-skeleton-bar" data-bar="title" />
      <div className="hg-paged-document-skeleton-bar" data-bar="a" />
      <div className="hg-paged-document-skeleton-bar" data-bar="b" />
      <div className="hg-paged-document-skeleton-bar" data-bar="c" />
      <div className="hg-paged-document-skeleton-spacer" />
      <div className="hg-paged-document-skeleton-bar" data-bar="foot" />
    </div>
  );
}

/** `unavailable` — this was never going to be here, and that is fine. Neutral, and never a retry. */
export function DocUnavailable({
  title,
  message,
  style,
}: {
  title: TranslatedText;
  message?: TranslatedText;
  style?: CSSProperties;
}) {
  return (
    <div className="hg-paged-document-unavailable" style={style}>
      <UnavailableNote variant="region" title={title} message={message} />
    </div>
  );
}

/**
 * A read that is out, or failed: one centre for both, so the place focus returns to once *Try
 * again* leaves stays while the read reloads. A <section> so the document's own name is a legal
 * accessible name here — a bare div takes no aria-label.
 */
export function DocCentre({
  failed,
  geometry,
  label,
  layingOut,
  title,
  message,
  onRetry,
  retryLabel,
  style,
}: {
  failed: boolean;
  geometry: PageGeometry;
  label: TranslatedText;
  layingOut: TranslatedText;
  title: TranslatedText;
  message: TranslatedText;
  onRetry?: () => void;
  retryLabel: TranslatedText;
  style?: CSSProperties;
}) {
  const centre = useRef<HTMLElement>(null);
  return (
    <section
      ref={centre}
      tabIndex={-1}
      className="hg-paged-document-centre hg-focus-target"
      aria-label={label}
      style={style}
    >
      {failed ? (
        <DocMessage
          geometry={geometry}
          title={title}
          message={message}
          onRetry={onRetry}
          retryLabel={retryLabel}
          focusAfter={centre}
        />
      ) : (
        <SheetSkeleton geometry={geometry} name={layingOut} />
      )}
    </section>
  );
}

/** The failed read's card: what happened, and its *Try again*. */
function DocMessage({
  geometry,
  title,
  message,
  onRetry,
  retryLabel,
  focusAfter,
}: {
  geometry: PageGeometry;
  title: TranslatedText;
  message: TranslatedText;
  onRetry?: () => void;
  retryLabel: TranslatedText;
  /** The centre that holds the card, which stays while the retried read reloads. */
  focusAfter: FocusAfter;
}) {
  return (
    <div className="hg-paged-document-card" style={{ width: geometry.width }}>
      <p className="hg-paged-document-card-title">{title}</p>
      <p className="hg-paged-document-card-body">{message}</p>
      {onRetry !== undefined && (
        <div className="hg-paged-document-card-action">
          <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
        </div>
      )}
    </div>
  );
}
