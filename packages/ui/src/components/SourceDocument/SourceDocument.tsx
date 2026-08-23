/* SourceDocument (web) — A FILE THE USER HANDED THE PRODUCT, RENDERED FOR READING (M01-40 P0).

   It USES ImageFrame per page, inheriting the loading / present / permanently-missing footprint law
   rather than restating it, and adds what a photograph never has: a page count, a page you can move
   through, a file identity and a "no preview for this kind" state.

   THIS IS THE OPPOSITE OF PreviewFrame, which is why it is not one. A preview is looked at; a
   source document is READ AND OPERATED — so it is never made unreachable and never aria-hidden.

   PAGED, NOT A CONTINUOUS SCROLL: a reviewer on a phone needs a stable target and a page number
   that means something. */

import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ReadAlongside } from './ReadAlongside';
import {
  currentPage,
  pageAspect,
  readingHeight,
  resolveDocumentState,
} from './SourceDocument.logic';
import { useDocumentReading } from './SourceDocument.reading';
import type { SourceDocumentProps } from './SourceDocument.types';
import { SourceDocumentBody } from './SourceDocumentBody';
import { SourceDocumentHeader } from './SourceDocumentHeader';

interface WebSourceDocumentProps extends SourceDocumentProps {
  className?: string;
  style?: CSSProperties;
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
  className,
  style,
}: WebSourceDocumentProps) {
  const reading = useDocumentReading({ page, onPageChange, fit: fitProp, onFitChange });

  const resolved = resolveDocumentState(state, pages.length);
  const cur = currentPage(pages, reading.page);
  const bodyH = readingHeight(height);

  return (
    <section
      aria-label={label || `${name} — source document`}
      className={classNames('hg-source-doc', className)}
      data-density={density}
      style={style}
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
      <div className="hg-source-doc-body" data-fit={reading.fit} style={{ height: bodyH }}>
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
      </div>
      {cur?.label && resolved === 'ready' ? (
        <footer className="hg-source-doc-footer">{cur.label}</footer>
      ) : null}
    </section>
  );
}

SourceDocument.Alongside = ReadAlongside;
