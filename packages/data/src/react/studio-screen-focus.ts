import {
  type FocusJob,
  type FocusParts,
  focusOf,
  type StudioView,
  studioJobOf,
  type UndoSlots,
} from '@heliogrid/domain';
import type { StudioSaveState } from './studio-save-queue';

/**
 * Which parts the studio shows (focus mode, `T-M05-002`, part b): the roof step's job, what is open
 * over it, the view and LiDAR (`T-M05-002g`), on a phone-width screen or a wider one.
 */
export function studioFocusOf(input: {
  readonly job: FocusJob;
  readonly open: {
    readonly roofs: boolean;
    readonly sheet: boolean;
    readonly picture: boolean;
    /** The picture panel or the View panel: on a phone it opens at the foot. */
    readonly menu: boolean;
  };
  readonly view: StudioView;
  readonly canEdit: boolean;
  readonly hasRoof: boolean;
  readonly saving: StudioSaveState;
  readonly slots: UndoSlots;
  readonly lidar: boolean;
}): (phone: boolean) => FocusParts {
  const { saving } = input;
  return (phone) =>
    focusOf({
      // Beside its button a panel moves nothing else; at a phone's foot it takes the tools' place.
      job: studioJobOf(input.job, { ...input.open, menu: phone && input.open.menu }),
      view: input.view,
      phone,
      canEdit: input.canEdit,
      hasRoof: input.hasRoof,
      saveFailed: saving.kind === 'failed' || saving.kind === 'refused',
      slots: input.slots,
      lidar: input.lidar,
      saveAsks: saving.kind !== 'saved' && saving.kind !== 'saving',
    });
}
