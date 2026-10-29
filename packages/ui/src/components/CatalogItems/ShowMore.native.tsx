import { useFocusAfter } from '../../primitives/FocusAfter';
import { Button } from '../Button/Button.native';
import type { ShowMoreProps } from './CatalogItems.types';

/** Same contract as the web half: once the last page lands it leaves, and the reader goes to the list. */
export function ShowMore({ label, onMore, focusAfter }: ShowMoreProps) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <Button variant="ghost" size="sm" onClick={leaving(onMore)}>
      {label}
    </Button>
  );
}
