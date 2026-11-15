'use client';
import type { LinkSection } from '@heliogrid/domain';
import { type RefCallback, useCallback, useRef } from 'react';

/** A glance shorter than this is a scroll past, not a read. */
const SHORTEST_VIEW_SECONDS = 2;
/** How much of a section must be on screen for it to count as being read. */
const IN_VIEW_SHARE = 0.5;
const MS_PER_SECOND = 1000;

/** The attribute a card of the page carries to name the section it is (`LINK_SECTIONS`). */
export const SECTION_ATTRIBUTE = 'data-link-section';

/**
 * How long each section of the customer's page was on screen (`F5-28`, `M06-54`): the product's own
 * evidence of a read, sent when a section leaves the screen or the tab is hidden, and timed afresh
 * when the tab comes back. The DOM half only — what is sent, and to whom it is never sent, is the
 * data hook's (`viewed`). A callback ref, so the cards are watched whenever the page that holds them
 * is drawn — a first paint that is the loading state attaches nothing, and the cards that follow it
 * are watched when they mount.
 */
export function useSectionViews(
  viewed: (view: { section: LinkSection; seconds: number }) => void,
): RefCallback<HTMLDivElement> {
  const report = useRef(viewed);
  report.current = viewed;
  return useCallback((page: HTMLDivElement | null) => {
    if (page === null || typeof IntersectionObserver === 'undefined') return;
    return watchSections(page, (view) => report.current(view));
  }, []);
}

function watchSections(
  page: HTMLDivElement,
  report: (view: { section: LinkSection; seconds: number }) => void,
): () => void {
  const since = new Map<string, number>();
  const inView = new Set<string>();
  const leave = (section: string) => {
    const from = since.get(section);
    if (from === undefined) return;
    since.delete(section);
    const seconds = Math.round((Date.now() - from) / MS_PER_SECOND);
    if (seconds >= SHORTEST_VIEW_SECONDS) report({ section: section as LinkSection, seconds });
  };
  const leaveAll = () => {
    for (const section of [...since.keys()]) leave(section);
  };
  const begin = (section: string) => {
    if (document.visibilityState === 'visible' && !since.has(section)) {
      since.set(section, Date.now());
    }
  };
  const seen = (entry: IntersectionObserverEntry) => {
    const section = entry.target.getAttribute(SECTION_ATTRIBUTE);
    if (section === null) return;
    if (entry.isIntersecting) {
      inView.add(section);
      begin(section);
    } else {
      inView.delete(section);
      leave(section);
    }
  };
  const observer = new IntersectionObserver((entries) => entries.forEach(seen), {
    threshold: IN_VIEW_SHARE,
  });
  for (const card of page.querySelectorAll(`[${SECTION_ATTRIBUTE}]`)) observer.observe(card);
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') leaveAll();
    else for (const section of inView) begin(section);
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    observer.disconnect();
    leaveAll();
  };
}
