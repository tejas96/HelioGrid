import { EditorSurface } from '../EditorSurface/EditorSurface';
import { RoleCard } from './RoleCard';
import type { RoleCardSurfaceProps } from './RoleCard.types';

/**
 * The reopened card: the 480 right panel with its close, which scrolls the card whole, or the sheet
 * below the panel width, whose body holds still while the card's rows scroll under its head.
 */
export function RoleCardSurface({
  open,
  onClose,
  title,
  closeLabel,
  ...card
}: RoleCardSurfaceProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={closeLabel}
      width={480}
      showClose
      sheetProps={{ dragToDismiss: false, bodyScrolls: false }}
    >
      {({ panel }) => <RoleCard layout={panel ? 'flowing' : 'bounded'} {...card} />}
    </EditorSurface>
  );
}
