import { useFocusAfter } from '../../primitives/FocusAfter';
import { Button } from '../Button';
import type { ShowMoreProps } from './CatalogItems.types';

/** *Show more* under a paged list: once the last page lands it leaves, and focus goes to the list. */
export function ShowMore({ label, onMore, focusAfter }: ShowMoreProps) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <Button variant="ghost" size="sm" onClick={leaving(onMore)}>
      {label}
    </Button>
  );
}
