import type { CSSProperties, ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { UnavailableNote } from '../UnavailableNote';
import type { PageGeometry } from './PagedDocument.types';
import { PrintScope } from './PrintScope';

export interface AnnotationItem {
  id: string;
  label?: string;
  content?: ReactNode;
}

/** Saved, and not printed. Canvas-coloured and labelled, so it never reads as part of the paper. */
export function Annotations({
  items,
  width,
  web,
}: {
  items: AnnotationItem[];
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
            {a.label || 'Internal note'} · saved, not printed
          </p>
          {a.content}
        </div>
      ))}
    </PrintScope>
  );
}

export function InternalStamp({ web }: { web?: boolean }) {
  return (
    <p className="hg-paged-document-stamp" data-web={web ? 'true' : undefined}>
      Internal copy — not for the customer.
    </p>
  );
}

export function SheetSkeleton({ geometry }: { geometry: PageGeometry }) {
  return (
    <div
      role="status"
      aria-label="Laying out the document"
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

export function DocLoading({
  geometry,
  label,
  style,
}: {
  geometry: PageGeometry;
  label: string;
  style?: CSSProperties;
}) {
  return (
    /* A <section> so the document's own name is a legal accessible name here — a bare div takes no
       aria-label. The skeleton inside keeps role="status" and says what is happening. */
    <section className="hg-paged-document-centre" aria-label={label} style={style}>
      <SheetSkeleton geometry={geometry} />
    </section>
  );
}

/** `unavailable` — this was never going to be here, and that is fine. Neutral, and never a retry. */
export function DocUnavailable({
  title,
  message,
  style,
}: {
  title?: string;
  message?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="hg-paged-document-unavailable" style={style}>
      <UnavailableNote variant="region" title={title} message={message} />
    </div>
  );
}

export function DocMessage({
  geometry,
  title,
  message,
  onRetry,
  style,
}: {
  geometry: PageGeometry;
  title: string;
  message?: string;
  onRetry?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div className="hg-paged-document-centre" style={style}>
      <div className="hg-paged-document-card" style={{ width: geometry.width }}>
        <p className="hg-paged-document-card-title">{title}</p>
        {message && <p className="hg-paged-document-card-body">{message}</p>}
        {onRetry && (
          <Pressable className="hg-paged-document-retry" onPress={onRetry}>
            Try again
          </Pressable>
        )}
      </div>
    </div>
  );
}
