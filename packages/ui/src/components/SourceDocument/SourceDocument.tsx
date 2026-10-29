/* SourceDocument (web) — A FILE THE USER HANDED THE PRODUCT, RENDERED FOR READING.

   It USES ImageFrame per page, inheriting the loading / present / permanently-missing footprint law
   rather than restating it, and adds what a photograph never has: a page count, a page you can move
   through, a file identity and a "no preview for this kind" state.

   THIS IS THE OPPOSITE OF PreviewFrame, which is why it is not one. A preview is looked at; a
   source document is READ AND OPERATED — so it is never made unreachable and never aria-hidden.

   PAGED, NOT A CONTINUOUS SCROLL: a reviewer on a phone needs a stable target and a page number
   that means something. */

import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { ReadAlongside } from './ReadAlongside';
import { DOCUMENT_HEIGHT, documentNameOf, documentViewOf } from './SourceDocument.logic';
import { useDocumentReading } from './SourceDocument.reading';
import type { SourceDocumentProps } from './SourceDocument.types';
import { SourceDocumentBody } from './SourceDocumentBody';
import { SourceDocumentHeader } from './SourceDocumentHeader';

interface WebSourceDocumentProps extends SourceDocumentProps {
  className?: string;
  style?: CSSProperties;
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
  className,
  style,
}: WebSourceDocumentProps) {
  const reading = useDocumentReading({ page, onPageChange, fit: fitProp, onFitChange });
  /* The document's own frame stays while a failed file reloads, so *Try again* hands focus to it. */
  const frame = useRef<HTMLElement>(null);

  const view = documentViewOf(pages, reading.page, state, height);

  return (
    <section
      ref={frame}
      tabIndex={-1}
      aria-label={documentNameOf(label, name, words)}
      className={classNames('hg-source-doc', 'hg-focus-target', className)}
      data-density={density}
      style={style}
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
      <div
        className="hg-source-doc-body"
        data-fit={reading.fit}
        style={{ height: view.bodyHeight }}
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
      </div>
      {view.caption ? <footer className="hg-source-doc-footer">{view.caption}</footer> : null}
    </section>
  );
}

SourceDocument.Alongside = ReadAlongside;
