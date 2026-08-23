/* The flow: sections resolved into atoms BEFORE anything is measured, so a dropped page is never
   counted and an audience variant is never a page that renders empty. Plus the two renderers —
   one whole atom (web rendering and the hidden measure pass) and one packed part (a sheet). */
import type { ReactNode } from 'react';
import type { DisclosureKind, DisclosureSpec } from '../Disclosure';
import { DisclosureSet } from '../Disclosure';
import type { AnnotationItem } from './DocumentChrome';
import type { FlowAtom, SheetPart } from './document-cut';
import type { DocumentAudience, DocumentSection, TitleBlockSpec } from './PagedDocument.types';
import { TitleBlock } from './TitleBlock';

export interface FlowItem<Row> extends FlowAtom {
  node?: ReactNode;
  section?: DocumentSection<Row>;
  rows?: Row[];
}

export interface BuiltFlow<Row> {
  items: FlowItem<Row>[];
  annotations: (AnnotationItem & { after: string | null })[];
}

export interface BuildFlowArgs<Row> {
  sections: DocumentSection<Row>[];
  titleBlock?: TitleBlockSpec;
  disclosures?: (DisclosureKind | DisclosureSpec)[];
  disclosuresAfter?: string;
  audience: DocumentAudience;
}

/**
 * WHICH SECTIONS THIS AUDIENCE PRINTS, and which are screen-only notes beside them. Resolved
 * BEFORE anything is measured, so a dropped page is never counted and an audience variant is never
 * a page that renders empty. An annotation remembers the printed section it followed.
 */
function selectSections<Row>(
  sections: DocumentSection<Row>[],
  audience: DocumentAudience,
): { printed: DocumentSection<Row>[]; annotations: BuiltFlow<Row>['annotations'] } {
  const keep = (s: DocumentSection<Row>) =>
    s.when !== false && (!s.audience || s.audience === 'both' || s.audience === audience);
  const printed: DocumentSection<Row>[] = [];
  const annotations: BuiltFlow<Row>['annotations'] = [];
  for (const s of sections.filter(keep)) {
    if (s.screenOnly) {
      annotations.push({
        id: s.id,
        label: s.label,
        content: s.content,
        after: printed.length ? (printed[printed.length - 1]?.id ?? null) : null,
      });
    } else {
      printed.push(s);
    }
  }
  return { printed, annotations };
}

/** One printed section as a flow atom — `rows` when it carries rows, a whole node otherwise. */
function sectionAtom<Row>(s: DocumentSection<Row>): FlowItem<Row> {
  return {
    id: s.id,
    kind: s.rows ? 'rows' : 'node',
    node: s.content,
    section: s,
    startsPage: s.startsPage === true,
    keepWithLast: s.keepWithLast,
    rows: s.rows,
  };
}

export function buildFlow<Row>({
  sections,
  titleBlock,
  disclosures,
  disclosuresAfter,
  audience,
}: BuildFlowArgs<Row>): BuiltFlow<Row> {
  const { printed, annotations } = selectSections(sections, audience);

  const items: FlowItem<Row>[] = [];
  if (titleBlock) {
    items.push({
      id: '__title',
      kind: 'node',
      node: <TitleBlock {...titleBlock} audience={audience} />,
    });
  }
  /* The disclosures are a REQUIRED atom, not a section: no prop removes them, nothing can mark
     them screenOnly, and omitting them on a customer document warns. They sit after the section
     named, or first. */
  const discNode: FlowItem<Row> | null = disclosures?.length
    ? {
        id: '__disclosures',
        kind: 'node',
        node: <DisclosureSet items={disclosures} surface="document" />,
      }
    : null;
  if (discNode && !disclosuresAfter) items.push(discNode);
  for (const s of printed) {
    items.push(sectionAtom(s));
    if (discNode && disclosuresAfter === s.id) items.push(discNode);
  }
  return { items, annotations };
}

/** The whole atom — the web rendering and the hidden measure pass both show every row at once. */
export function renderWhole<Row>(it: FlowItem<Row>): ReactNode {
  if (it.kind === 'rows') {
    const rows = it.rows ?? [];
    return (
      it.section?.renderRows?.(rows, {
        continued: false,
        first: true,
        last: true,
        from: 0,
        to: rows.length,
        count: rows.length,
      }) ?? null
    );
  }
  return it.node !== undefined ? it.node : (it.section?.content ?? null);
}

/** One packed part on one sheet. `continued` is what repeats a caption and a header. */
export function renderPart<Row>(byId: Map<string, FlowItem<Row>>, p: SheetPart): ReactNode {
  const it = byId.get(p.id);
  if (!it) return null;
  if (p.kind === 'rows') {
    const rows = it.rows ?? [];
    const from = p.from ?? 0;
    const to = p.to ?? rows.length;
    return (
      it.section?.renderRows?.(rows.slice(from, to), {
        continued: p.continued === true,
        first: from === 0,
        last: p.last === true,
        from,
        to,
        count: rows.length,
      }) ?? null
    );
  }
  return it.node !== undefined ? it.node : (it.section?.content ?? null);
}

/** Does this sheet hold the last part of `sectionId`? Places an annotation beside its content. */
export function sheetEndsSection(
  sheets: SheetPart[][],
  si: number,
  sectionId: string | null,
): boolean {
  if (!sectionId) return si === sheets.length - 1;
  const on = sheets.findIndex((parts) =>
    parts.some((p) => p.id === sectionId && (p.kind !== 'rows' || p.last === true)),
  );
  return on === si || (on === -1 && si === sheets.length - 1);
}

/** A stable key for one emitted sheet: the parts it carries, never the loop index. */
export function sheetKey(parts: SheetPart[]): string {
  return parts.map((p) => `${p.id}:${p.from ?? ''}`).join('|');
}
