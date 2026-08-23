/* PagedDocument — THE PAGE MODEL, AND IT IS ONE CUT CONSUMED BY TWO RENDERINGS.

   M06-50 makes the preview "exactly what the customer will see" and SCR-M06-15 asks for
   "multi-page pagination — PIXEL-FOR-CONTENT IDENTICAL to what the customer's rendering will
   show". Letting the browser fragment a long flow cannot promise that: the app never learns the
   page COUNT, so numbering can only be a CSS counter nothing can read, and a conditional page
   cannot be counted at all.

   So: MEASURE ONCE, THEN EMIT EXPLICIT SHEETS. The flow is laid out hidden at the exact content
   width, every atom is measured, the atoms are packed into sheets, and the result is rendered as
   real <section> elements at real paper size. Print then has nothing left to decide — one sheet is
   one page — and the screen is showing the same elements in the same sheets. */
import { type CSSProperties, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { usePageSize } from '../../utils/page-size';
import {
  Annotations,
  DocLoading,
  DocMessage,
  DocUnavailable,
  InternalStamp,
  SheetSkeleton,
} from './DocumentChrome';
import { DocumentSheet } from './DocumentSheet';
import { measureFlow, packSheets, type SheetPart } from './document-cut';
import { buildFlow, renderPart, renderWhole, sheetEndsSection, sheetKey } from './document-flow';
import type { DocumentSectionSpan, PagedDocumentProps } from './PagedDocument.types';
import { PageEstimate } from './PageEstimate';
import { PrintScope } from './PrintScope';
import { estimatePages, pageGeometry } from './page-geometry';
import { TitleBlock } from './TitleBlock';

interface WebPagedDocumentProps<Row> extends PagedDocumentProps<Row> {
  className?: string;
  style?: CSSProperties;
}

function PagedDocumentRoot<Row>({
  paper = 'a4',
  orientation = 'portrait',
  margin = 48,
  rendering = 'paged',
  audience = 'customer',
  titleBlock,
  sections = [],
  disclosures,
  disclosuresAfter,
  footNote,
  numbering,
  label = 'Proposal',
  onCut,
  state = 'ready',
  errorTitle = "Couldn't build this document",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'No document for this proposal',
  unavailableMessage,
  className,
  style,
}: WebPagedDocumentProps<Row>) {
  const g = useMemo(
    () => pageGeometry({ paper, orientation, margin }),
    [paper, orientation, margin],
  );

  /* THE PRESENCE GUARD. `disclosures` has no off switch, but omitting the prop would otherwise
     render a customer document with no mandatory line at all — M06-04 (P0) satisfied by a caller
     remembering, which is what this system does not accept. Internal artefacts are exempt. */
  useEffect(() => {
    if (audience === 'customer' && !disclosures?.length) {
      console.warn(
        'PagedDocument: a customer document with no `disclosures`. M06-04 (P0) requires the mandatory lines on every Path B document, verbatim and in the reading flow — pass the kinds that are true (`indicative-basis`, `remote-survey`, `structure`, `staleness`). Use audience="internal" for an artefact the customer never sees.',
      );
    }
  }, [audience, disclosures]);

  /* THE PAGE BOX, from this document's own geometry. `@page` is document-level — no element can
     set it — so the sheets' paper reaches print through here or not at all. `web` rendering
     declares nothing: it is a page, not paper. */
  usePageSize(rendering === 'paged' ? { paper, orientation } : null);

  const flow = useMemo(
    () => buildFlow({ sections, titleBlock, disclosures, disclosuresAfter, audience }),
    [sections, titleBlock, disclosures, disclosuresAfter, audience],
  );

  const sig = useMemo(
    () =>
      JSON.stringify([
        paper,
        orientation,
        g.contentW,
        g.flowH,
        audience,
        flow.items.map((it) => [it.id, it.kind, it.rows ? it.rows.length : 0]),
      ]),
    [paper, orientation, g, audience, flow],
  );

  const [cutState, setCutState] = useState<{ sig: string; sheets: SheetPart[][] } | null>(null);
  const measurer = useRef<HTMLDivElement | null>(null);
  const paged = rendering === 'paged' && state === 'ready';
  /* A cut belongs to the signature it was measured under; a changed signature is no cut at all. */
  const cut = cutState && cutState.sig === sig ? cutState.sheets : null;

  useEffect(() => {
    if (!paged || cut !== null) return undefined;
    let live = true;
    const run = () => {
      const root = measurer.current;
      if (!live || !root) return;
      setCutState({ sig, sheets: packSheets(measureFlow(root, flow.items), g.flowH) });
    };
    /* Heights are type-dependent, so the cut waits for the webfonts rather than measuring
       fallbacks and re-cutting a page later. */
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(run);
    } else {
      run();
    }
    return () => {
      live = false;
    };
  }, [paged, cut, flow, g.flowH, sig]);

  useEffect(() => {
    if (!cut || !onCut) return;
    /* PER-SECTION SPANS, because "how many pages is the terms section" is the question a page
       estimate actually asks, and `sheets` is the WHOLE document. */
    const spans: Record<string, DocumentSectionSpan> = {};
    cut.forEach((parts, si) => {
      for (const p of parts) {
        const held = spans[p.id];
        if (held) {
          held.from = Math.min(held.from, si + 1);
          held.to = Math.max(held.to, si + 1);
        } else {
          spans[p.id] = { from: si + 1, to: si + 1, sheets: 0 };
        }
      }
    });
    for (const s of Object.values(spans)) s.sheets = s.to - s.from + 1;
    onCut({
      sheets: cut.length,
      rendering,
      geometry: g,
      audience,
      sections: spans,
      pagesOf: (id) => spans[id]?.sheets ?? 0,
      oversized: cut
        .flat()
        .filter((p) => p.oversized)
        .map((p) => p.id),
    });
  }, [cut, onCut, rendering, g, audience]);

  if (state === 'loading') return <DocLoading geometry={g} label={label} style={style} />;
  if (state === 'error') {
    return (
      <DocMessage
        geometry={g}
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        style={style}
      />
    );
  }
  if (state === 'unavailable') {
    return <DocUnavailable title={unavailableTitle} message={unavailableMessage} style={style} />;
  }

  /* THE WEB RENDERING. One `sections` array, the cut turned off — not a second document. The same
     nodes in the same order, the same disclosures in the same place, the same conditional
     resolution. There is no branch here that can carry different words. */
  if (rendering === 'web') {
    return (
      <article
        aria-label={label}
        className={classNames('hg-paged-document-web', className)}
        style={style}
      >
        {flow.items.map((it) => (
          <div key={it.id} data-keep-together={it.section?.keepTogether ? '' : undefined}>
            {renderWhole(it)}
          </div>
        ))}
        {flow.annotations.length > 0 && <Annotations items={flow.annotations} web />}
        {audience === 'internal' && <InternalStamp web />}
      </article>
    );
  }

  const byId = new Map(flow.items.map((it) => [it.id, it] as const));
  const count = cut ? cut.length : 0;
  const foot = numbering ?? ((n: number, m: number) => `Sheet ${n} of ${m}`);
  const head = titleBlock
    ? [titleBlock.projectName, titleBlock.proposalNumber].filter(Boolean).join(' · ')
    : label;

  return (
    <div
      data-print-root=""
      className={classNames('hg-sheet-stack', 'hg-paged-document-stack', className)}
      style={style}
    >
      {/* The hidden layout the cut is read from. It exists only while a cut is pending. */}
      {!cut && (
        <div
          ref={measurer}
          aria-hidden="true"
          className="hg-paged-document-measurer"
          style={{ width: g.contentW }}
        >
          {flow.items.map((it) => (
            <div key={it.id} data-mid={it.id}>
              {renderWhole(it)}
            </div>
          ))}
        </div>
      )}

      {cut?.map((parts, si) => (
        <Fragment key={sheetKey(parts)}>
          <DocumentSheet
            geometry={g}
            index={si}
            count={count}
            label={label}
            head={head}
            audience={audience}
            footNote={footNote}
            footText={foot(si + 1, count)}
          >
            {parts.map((p) => (
              <div
                key={`${p.id}-${p.from ?? 'n'}`}
                data-keep-together={p.kind === 'node' ? '' : undefined}
              >
                {renderPart(byId, p)}
              </div>
            ))}
          </DocumentSheet>
          {/* The annotation band: saved, on screen, never on a sheet — because a sheet's whole
              claim is that screen and paper are identical. */}
          {flow.annotations
            .filter((a) => sheetEndsSection(cut, si, a.after))
            .map((a) => (
              <Annotations key={a.id} items={[a]} width={g.width} />
            ))}
        </Fragment>
      ))}

      {!cut && <SheetSkeleton geometry={g} />}
    </div>
  );
}

/**
 * **The paged document and print surface — one cut, consumed by two renderings.**
 *
 * - **Counted numbering** (`MS9-02`): `sheets.length` *is* the count, so there is no second number
 *   to disagree with, and an empty trailing sheet cannot exist because a sheet is only created
 *   when something is placed on it.
 * - **Print scoping both ways**: `screenOnly` sections render beside the sheets; `disclosures` are
 *   a required atom with no off switch — and a customer document that omits them warns — and
 *   `PrintScope` hoists a mandatory line that finds itself inside a suppressed region.
 * - **The page estimate** stops being a guess: `estimatePages` / `PageEstimate` compute against
 *   this module's geometry, and `onCut` supplies the counted number.
 */
export const PagedDocument = Object.assign(PagedDocumentRoot, {
  geometry: pageGeometry,
  estimate: estimatePages,
  PageEstimate,
  TitleBlock,
  PrintScope,
});
