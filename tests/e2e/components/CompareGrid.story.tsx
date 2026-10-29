import { COMPARE_GRID, compareGridWords, createTranslator } from '@heliogrid/i18n';
import { CompareGrid, type CompareGridProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = compareGridWords(en.t);

/**
 * `CompareGrid` with its words bound in the browser: `compare` and `position` are functions the grid
 * calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedCompareGrid(
  props: Pick<CompareGridProps, 'read' | 'attributes' | 'options'>,
) {
  return (
    <CompareGrid
      {...props}
      words={words}
      selectLabel={en.t(COMPARE_GRID.select)}
      selectedLabel={en.t(COMPARE_GRID.selected)}
      currentLabel={en.t(COMPARE_GRID.current)}
      emptyTitle={en.t(COMPARE_GRID.emptyTitle)}
      errorTitle={en.t(COMPARE_GRID.errorTitle)}
      unavailableTitle={en.t(COMPARE_GRID.unavailableTitle)}
    />
  );
}
