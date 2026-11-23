import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { RoofBar, StudioView } from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';

/** What the roofs' sentence is chosen from. */
export interface RoofStatusFacts {
  readonly studio: StudioScreen;
  readonly view: StudioView;
  readonly words: StudioCanvasWords;
  /** The corner held is crowded by another on the screen. */
  readonly crowded: boolean;
  /** The reader may change the design. */
  readonly editable: boolean;
}

/**
 * The roofs' sentence in the bar: a refusal, what an act did, why the picked roof has no parapet
 * where another roof takes its side, or what the view lets a person do.
 */
export function roofsStatus(
  bar: Extract<RoofBar, { kind: 'roofs' }>,
  facts: RoofStatusFacts,
  shown: RoofWordsShown,
): TranslatedText {
  const { words, studio } = facts;
  if (bar.live !== null) return words.editRefusal(bar.live, shown, bar.liveHeld);
  if (facts.crowded && studio.roofStep.kind === 'dragging') return words.dragCrowded;
  // Undo and Redo name themselves in every view.
  const kind = bar.said?.kind;
  if (kind === 'undone' || kind === 'redone') return words.roofLine(bar.said, false, shown);
  // In 3D the outline is not changed: what a person does here is a roof's height — or, for a
  // reader, looks at it.
  if (facts.view !== 'top') return facts.editable ? words.roofIdle3d : words.roofIdle3dReader;
  // A roof picked with nothing more to say: where another roof takes its side, the line says why
  // it has no parapet there.
  const taken = bar.picked === null ? null : (studio.topMarks[bar.picked]?.noWall ?? null);
  if (bar.said === null && !bar.sizing && taken !== null) return words.noWallWhy(taken);
  return words.roofLine(bar.said, bar.sizing, shown);
}
