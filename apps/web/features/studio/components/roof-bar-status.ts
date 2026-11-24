import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { RoofBar, StudioView } from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';

/** What the roofs' moment is chosen from. */
export interface RoofStatusFacts {
  readonly studio: StudioScreen;
  readonly view: StudioView;
  readonly words: StudioCanvasWords;
  /** The corner held is crowded by another on the screen. */
  readonly crowded: boolean;
}

/** What a roof became as it closed: the top view's card says it, with its chips. */
const KIND_SAID: ReadonlySet<string> = new Set(['closed', 'made', 'cut', 'joined']);

/**
 * A moment's words in the bar, once a roof stands: a refusal, what an act just did, or why the
 * picked roof has no parapet where another roof takes its side. `null` at rest: the bar never
 * names a roof, its area or the count, which Roofs holds.
 */
export function roofsMoment(
  bar: Extract<RoofBar, { kind: 'roofs' }>,
  facts: RoofStatusFacts,
  shown: RoofWordsShown,
): TranslatedText | null {
  const { words, studio } = facts;
  if (bar.live !== null) return words.editRefusal(bar.live, shown, bar.liveHeld);
  if (facts.crowded && studio.roofStep.kind === 'dragging') return words.dragCrowded;
  // What a roof became is the top view's card; in 3D it has no chips and says nothing.
  if (facts.view !== 'top' && bar.said !== null && KIND_SAID.has(bar.said.kind)) return null;
  // A roof picked with nothing more to say: where another roof takes its side, the line says why
  // it has no parapet there.
  const taken = bar.picked === null ? null : (studio.topMarks[bar.picked]?.noWall ?? null);
  if (bar.said === null && !bar.sizing && taken !== null) return words.noWallWhy(taken);
  return words.roofLine(bar.said, bar.sizing, shown);
}
