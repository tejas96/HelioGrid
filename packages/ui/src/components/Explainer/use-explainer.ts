import { capExplainerPages, explainerPageAfter, explainerView } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import { auditExplainerPages } from './Explainer.logic';
import type { ExplainerOpenReason, ExplainerPage, ExplainerProps } from './Explainer.types';

type ExplainerState = Pick<
  ExplainerProps,
  'pages' | 'open' | 'defaultOpen' | 'onOpenChange' | 'nextLabel' | 'backLabel' | 'positionLabel'
>;

/**
 * Open or closed, and which page — the same for both halves. The page moves only through
 * `@heliogrid/domain`'s model, which also resets it whenever the ask closes, however it closed.
 */
export function useExplainer({
  pages,
  open,
  defaultOpen = false,
  onOpenChange,
  nextLabel,
  backLabel,
  positionLabel,
}: ExplainerState) {
  const { kept, dropped } = capExplainerPages<ExplainerPage>(pages);
  const total = kept.length;
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const [page, setPage] = useState(0);
  /** What opened it: an ask opened by hover closes when the pointer leaves; one opened by a tap does not. */
  const openedBy = useRef<ExplainerOpenReason | null>(null);
  const isOpen = open ?? selfOpen;

  const violations = auditExplainerPages(kept);
  const report = violations
    .map((hit) => `<${hit.component}> belongs in ${hit.belongsIn}`)
    .join('; ');
  const unworded =
    total > 1 &&
    (nextLabel === undefined || backLabel === undefined || positionLabel === undefined);
  useEffect(() => {
    if (total === 0) {
      console.warn(
        'Explainer: no page to show, so no trigger is drawn — an ask for nothing is a dead control.',
      );
    }
    if (unworded) {
      console.warn(
        'Explainer: a paged ask needs nextLabel, backLabel and positionLabel; without them only its first page can be read.',
      );
    }
    if (dropped > 0) {
      console.warn(
        `Explainer: ${dropped} page(s) past the third were dropped. That content belongs on the screen, in an Accordion, or on its own help surface (F7-46).`,
      );
    }
    if (report !== '') {
      console.warn(`Explainer: never opened behind a tap (F8-07, F7-35, MS10-19): ${report}.`);
    }
  }, [total, unworded, dropped, report]);

  useEffect(() => {
    if (!isOpen) {
      openedBy.current = null;
      setPage((current) => explainerPageAfter(current, 'close', total));
    }
  }, [isOpen, total]);

  const commit = (next: boolean, reason: ExplainerOpenReason) => {
    if (open === undefined) setSelfOpen(next);
    onOpenChange?.(next, { reason });
  };

  const current = Math.min(page, Math.max(0, total - 1));
  const { pager, showsAction } = explainerView(current, total);
  return {
    /** Nothing to teach: the component draws no trigger at all. */
    empty: total === 0,
    isOpen,
    openedBy,
    content: kept[current],
    showsAction,
    /* A paged ask cannot be typed without its words; an untyped caller without them gets no pager. */
    pager:
      pager === null ||
      nextLabel === undefined ||
      backLabel === undefined ||
      positionLabel === undefined
        ? null
        : {
            ...pager,
            nextLabel,
            backLabel,
            position: positionLabel(pager.page, pager.total),
          },
    show: (reason: ExplainerOpenReason) => {
      openedBy.current = reason;
      commit(true, reason);
    },
    hide: (reason: ExplainerOpenReason) => commit(false, reason),
    move: (step: 'next' | 'back') => setPage((before) => explainerPageAfter(before, step, total)),
  };
}
