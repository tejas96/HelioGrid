import { useState } from 'react';
import type { SourceDocumentFit, SourceDocumentProps } from './SourceDocument.types';

export interface DocumentReading {
  page: number;
  fit: SourceDocumentFit;
  setPage: (n: number) => void;
  setFit: (f: SourceDocumentFit) => void;
}

export interface DocumentReadingInput {
  page?: number;
  onPageChange?: SourceDocumentProps['onPageChange'];
  fit?: SourceDocumentFit;
  onFitChange?: SourceDocumentProps['onFitChange'];
}

/**
 * Where the reader is in the document: the page they are on, and how it is fitted.
 *
 * Controlled the moment the caller passes `page` or `fit` — a screen keeping the page in a URL
 * owns it, one that does not never has to. Either way the caller is TOLD, so the change reaches a
 * URL, an analytics event or nothing at all without this component knowing which it is.
 */
export function useDocumentReading({
  page,
  onPageChange,
  fit,
  onFitChange,
}: DocumentReadingInput): DocumentReading {
  const [innerPage, setInnerPage] = useState(0);
  const [innerFit, setInnerFit] = useState<SourceDocumentFit>('width');
  return {
    page: page ?? innerPage,
    fit: fit ?? innerFit,
    setPage: (n) => {
      if (page === undefined) {
        setInnerPage(n);
      }
      onPageChange?.(n);
    },
    setFit: (f) => {
      if (fit === undefined) {
        setInnerFit(f);
      }
      onFitChange?.(f);
    },
  };
}
