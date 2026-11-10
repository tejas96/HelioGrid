/**
 * A calm grey line drawing for a place with nothing in it, drawn once and then still — the quiet
 * art of an empty list, never colour and never information (the words beside it say what is empty):
 * - `search` rows and a lens: a search that found nothing
 * - `settle` cards settling into a tray: a list with nothing in it yet
 * - `filter` a funnel that lets nothing through: filters that match nothing
 */
export type EmptySceneName = 'search' | 'settle' | 'filter';

/** `regular` 120 × 96, over a block's words · `compact` half that, beside a line in a small tile. */
export type EmptySceneSize = 'regular' | 'compact';

export interface EmptySceneProps {
  readonly name: EmptySceneName;
  readonly size?: EmptySceneSize;
}
