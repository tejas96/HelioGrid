import type { MouseEvent } from 'react';
import { documentHeaderOf } from './SourceDocument.logic';
import type { SourceDocumentHeaderProps } from './SourceDocument.types';
import { Chrome, IconBtn } from './SourceDocumentChrome';

/**
 * The file's identity and everything you can do to it while it is readable: which page you are on
 * and how it is fitted, plus the route to the real file. The paging controls are 44×44 and the
 * count is announced politely, because moving a page is the reviewer's main act here.
 */
export function SourceDocumentHeader(props: SourceDocumentHeaderProps) {
  const { name, meta, pageNumber, fit, onPage, onFit, originalUrl, onOpenOriginal, words } = props;
  const header = documentHeaderOf(props);
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
      {header.paged ? (
        <Chrome>
          <IconBtn
            label={words.previousPage}
            glyph="chevron-left"
            disabled={header.atFirst}
            onClick={() => onPage(pageNumber - 1)}
          />
          <span aria-live="polite" className="hg-source-doc-count">
            {header.position}
          </span>
          <IconBtn
            label={words.nextPage}
            glyph="chevron-right"
            disabled={header.atLast}
            onClick={() => onPage(pageNumber + 1)}
          />
        </Chrome>
      ) : null}
      {header.paged ? (
        <Chrome>
          <IconBtn
            label={words.fitWidth}
            pressed={fit === 'width'}
            glyph="fit-width"
            onClick={() => onFit('width')}
          />
          <IconBtn
            label={words.fitPage}
            pressed={fit === 'page'}
            glyph="fit-page"
            onClick={() => onFit('page')}
          />
        </Chrome>
      ) : null}
      {header.showsOpen ? (
        <a
          className="hg-source-doc-open"
          href={originalUrl}
          target={originalUrl ? '_blank' : undefined}
          rel="noreferrer"
          onClick={openOriginal}
        >
          {props.openLabel}
        </a>
      ) : null}
    </header>
  );
}
