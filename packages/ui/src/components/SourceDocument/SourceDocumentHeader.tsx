import type { MouseEvent } from 'react';
import type { ResolvedDocumentState } from './SourceDocument.logic';
import type { SourceDocumentFit } from './SourceDocument.types';
import { Chrome, IconBtn } from './SourceDocumentChrome';

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
 * and how it is fitted, plus the route to the real file. The paging controls are 44×44 and the
 * count is announced politely, because moving a page is the reviewer's main act here.
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
  /* Without a URL the anchor has nowhere to go, so the caller's handler is the whole act. */
  const openOriginal = onOpenOriginal
    ? (e: MouseEvent<HTMLAnchorElement>) => {
        if (!originalUrl) {
          e.preventDefault();
        }
        onOpenOriginal();
      }
    : undefined;

  return (
    <header className="hg-source-doc-header">
      <span className="hg-source-doc-identity">
        <span className="hg-source-doc-name">{name}</span>
        {meta ? <span className="hg-source-doc-meta">{meta}</span> : null}
      </span>
      {paged ? (
        <Chrome>
          <IconBtn
            label="Previous page"
            glyph="chevron-left"
            disabled={pageNumber <= 0}
            onClick={() => onPage(pageNumber - 1)}
          />
          <span aria-live="polite" className="hg-source-doc-count">
            {pageNumber + 1} / {count}
          </span>
          <IconBtn
            label="Next page"
            glyph="chevron-right"
            disabled={pageNumber >= count - 1}
            onClick={() => onPage(pageNumber + 1)}
          />
        </Chrome>
      ) : null}
      {paged ? (
        <Chrome>
          <IconBtn
            label="Fit width"
            pressed={fit === 'width'}
            glyph="fit-width"
            onClick={() => onFit('width')}
          />
          <IconBtn
            label="Fit whole page"
            pressed={fit === 'page'}
            glyph="fit-page"
            onClick={() => onFit('page')}
          />
        </Chrome>
      ) : null}
      {canOpen && resolved === 'ready' ? (
        <a
          className="hg-source-doc-open"
          href={originalUrl}
          target={originalUrl ? '_blank' : undefined}
          rel="noreferrer"
          onClick={openOriginal}
        >
          {openLabel}
        </a>
      ) : null}
    </header>
  );
}
