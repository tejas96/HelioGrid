/**
 * Stands in for a figure inside a translated sentence. The catalog writes the sentence with the
 * slot where the reader's language puts the figure; the screen splits on it and draws the figure
 * apart, in mono (`F7-09`), so `₹3,999 / mo` and `₹3,999 / माह` both keep their own word order.
 */
export const FIGURE_SLOT = '\u0000';
