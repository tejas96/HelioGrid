import { describe, expect, it } from 'vitest';
import {
  capExplainerPages,
  type ExplainerPaging,
  explainerPageAfter,
  explainerView,
} from '../../src/shell/explainer';

const words = {
  nextLabel: 'Next',
  backLabel: 'Back',
  positionLabel: (page: number, total: number) => `${page} of ${total}`,
};

describe('the ask holds at most three pages (F7-46)', () => {
  it('keeps three pages and reports the ones it dropped', () => {
    expect(capExplainerPages(['a', 'b', 'c', 'd', 'e'])).toEqual({
      kept: ['a', 'b', 'c'],
      dropped: 2,
    });
    expect(capExplainerPages(['a', 'b'])).toEqual({ kept: ['a', 'b'], dropped: 0 });
  });

  it('keeps a third page and drops a fourth', () => {
    expect(capExplainerPages(['a', 'b', 'c'])).toEqual({ kept: ['a', 'b', 'c'], dropped: 0 });
    expect(capExplainerPages(['a', 'b', 'c', 'd'])).toEqual({
      kept: ['a', 'b', 'c'],
      dropped: 1,
    });
  });

  it('reads one page given alone as one page, and skips an empty one', () => {
    expect(capExplainerPages('a')).toEqual({ kept: ['a'], dropped: 0 });
    expect(capExplainerPages(['a', null, undefined, false, '', 'b'])).toEqual({
      kept: ['a', 'b'],
      dropped: 0,
    });
    expect(capExplainerPages<string>([])).toEqual({ kept: [], dropped: 0 });
  });

  it('refuses a fourth page, and a paged ask without its words, by type', () => {
    const one: ExplainerPaging<string> = { pages: 'a' };
    const three: ExplainerPaging<string> = { pages: ['a', 'b', 'c'], ...words };
    // @ts-expect-error — a fourth page is not an ask; it belongs on the screen
    const four: ExplainerPaging<string> = { pages: ['a', 'b', 'c', 'd'], ...words };
    // @ts-expect-error — a paged ask names its Back, Next and position in the reader's language
    const unworded: ExplainerPaging<string> = { pages: ['a', 'b'] };
    expect([one, three, four, unworded]).toHaveLength(4);
  });
});

describe('paging through the ask', () => {
  it('never steps past the first or the last page', () => {
    expect(explainerPageAfter(0, 'back', 3)).toBe(0);
    expect(explainerPageAfter(0, 'next', 3)).toBe(1);
    expect(explainerPageAfter(2, 'next', 3)).toBe(2);
    expect(explainerPageAfter(2, 'back', 3)).toBe(1);
    expect(explainerPageAfter(0, 'next', 1)).toBe(0);
  });

  it('opens on the first page again after closing', () => {
    expect(explainerPageAfter(2, 'close', 3)).toBe(0);
  });

  it('states its position and offers Back and Next on every page', () => {
    for (const page of [0, 1, 2]) {
      const view = explainerView(page, 3);
      expect(view.pager).toEqual({
        page: page + 1,
        total: 3,
        canBack: page > 0,
        canNext: page < 2,
      });
    }
  });

  it('offers Back and Next on both pages of a two-page ask, off at each edge', () => {
    expect(explainerView(0, 2).pager).toEqual({ page: 1, total: 2, canBack: false, canNext: true });
    expect(explainerView(1, 2).pager).toEqual({ page: 2, total: 2, canBack: true, canNext: false });
  });

  it('offers nothing for an ask with no page', () => {
    expect(explainerView(0, 0)).toEqual({ pager: null, showsAction: false });
  });

  it('draws no pager for a single page', () => {
    expect(explainerView(0, 1).pager).toBeNull();
  });

  it('offers the action on the last page only', () => {
    expect([0, 1, 2].map((page) => explainerView(page, 3).showsAction)).toEqual([
      false,
      false,
      true,
    ]);
    expect(explainerView(0, 1).showsAction).toBe(true);
    expect([0, 1].map((page) => explainerView(page, 2).showsAction)).toEqual([false, true]);
  });
});
