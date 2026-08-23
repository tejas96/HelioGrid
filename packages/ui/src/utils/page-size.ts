/* THE PAGE BOX — the half of print geometry CSS will not let a component own.

   Without a page box the browser decides the two things that matter most, paper size and paper
   margins, so a section sized to A4 (794×1123px at 96dpi) is laid inside the browser's smaller
   default printable area and either shrinks to fit or spills onto a second page. That is exactly
   the outcome measure-then-emit exists to prevent, and MS8-02 requires paper size to be consistent
   across every drawing sheet besides.

   WHY IT IS A MODULE AND NOT A STYLE PROP. `@page` is a document-level at-rule: it cannot be set
   from an element, an inline style or a React style object, and it does not cascade from a
   component's subtree. The only way a component's own geometry can reach it is to write the rule
   into the document, so this owns the one <style> tag.

   ONE DOCUMENT, ONE PAGE BOX. Two sheet sets on one page cannot print at two paper sizes, so the
   first registered owner holds and a second, different declaration warns instead of silently
   losing. The DEFAULT lives in @heliogrid/theme/print.css (A4 portrait, margin 0). */
import { createContext, useEffect, useId } from 'react';
import type { PageOrientation, Paper } from '../components/PagedDocument/PagedDocument.types';

export const PAPER_CSS: Record<Paper, string> = { a4: 'A4', letter: 'letter' };

export interface PageSizeSpec {
  paper?: Paper;
  orientation?: PageOrientation;
}

interface PageSizeOwner {
  paper: Paper;
  orientation: PageOrientation;
}

/** The rule itself. Exported so a test, a doc or a print-preview surface can read it verbatim. */
export function pageSizeRule({
  paper = 'a4',
  orientation = 'portrait',
}: PageSizeSpec = {}): string {
  const size = PAPER_CSS[paper] ?? PAPER_CSS.a4;
  const dir = orientation === 'landscape' ? 'landscape' : 'portrait';
  /* margin: 0 because the sheet carries its own margins — PagedDocument and DrawingSheet both pad
     inside the page box, so a page margin here would be counted twice. */
  return `@page{size:${size} ${dir};margin:0}`;
}

const owners = new Map<string, PageSizeOwner>();
let styleEl: HTMLStyleElement | null = null;

function write(): void {
  if (typeof document === 'undefined') return;
  const first = owners.values().next().value;
  if (!first) {
    if (styleEl?.parentNode) styleEl.parentNode.removeChild(styleEl);
    styleEl = null;
    return;
  }
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'hg-page-size';
    document.head.appendChild(styleEl);
  }
  const rule = pageSizeRule(first);
  if (styleEl.textContent !== rule) styleEl.textContent = rule;
}

/** Declare the page box for a set of sheets. Returns the unregister function. */
export function registerPageSize(id: string, spec: PageSizeSpec): () => void {
  const next: PageSizeOwner = {
    paper: spec.paper ?? 'a4',
    orientation: spec.orientation ?? 'portrait',
  };
  const held = owners.values().next().value;
  if (
    held &&
    owners.get(id) === undefined &&
    (held.paper !== next.paper || held.orientation !== next.orientation)
  ) {
    console.warn(
      `[HelioGrid] Two sheet sets on this page declare different paper: ${held.paper} ${held.orientation} is already set, ` +
        `and ${next.paper} ${next.orientation} was requested. \`@page\` is document-level, so the first one holds and this set ` +
        'will print on the wrong paper. Print them from separate pages.',
    );
  }
  owners.set(id, next);
  write();
  return () => {
    owners.delete(id);
    write();
  };
}

/** The owner of a sheet SET — a sheet inside one does not declare its own paper (MS8-02). */
export const PageSizeOwnerContext = createContext(false);

/** Declare the page box for as long as this component is mounted. `null` declares nothing. */
export function usePageSize(spec: PageSizeSpec | null): void {
  const id = useId();
  const paper = spec ? spec.paper : null;
  const orientation = spec ? spec.orientation : null;
  useEffect(() => {
    if (!paper && !orientation) return undefined;
    return registerPageSize(id, {
      paper: paper ?? undefined,
      orientation: orientation ?? undefined,
    });
  }, [id, paper, orientation]);
}
