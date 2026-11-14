import { FIGURE_SLOT } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { assembled, wordsAroundFigure } from '../src/copy/assembled';

const line = (text: string) => assembled(text.replace('{}', FIGURE_SLOT));

describe('wordsAroundFigure — a caption keeps its words wherever the figure falls in them', () => {
  it.each([
    ['the figure first, as English puts it', '{} to pay for itself', 'to pay for itself'],
    ['the figure inside, as another language may', 'कुल {} में वसूल', 'कुल में वसूल'],
    ['the figure last', 'paid back in {}', 'paid back in'],
    ['no figure in the words', 'to pay for itself', 'to pay for itself'],
  ])('%s', (_, words, caption) => {
    expect(wordsAroundFigure(line(words))).toBe(caption);
  });
});
