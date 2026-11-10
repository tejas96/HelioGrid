import { DEAL_SEGMENTS, type DealSegment } from '@heliogrid/domain';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type { SegmentedOption } from '../SegmentedControl/SegmentedControl.types';
import type {
  QuickAddCheckLine,
  QuickAddFormProps,
  QuickAddFormWords,
  QuickAddScreenFacts,
  QuickAddScreenWords,
} from './QuickAddForm.types';

/**
 * Each answer of the live check marked by what it means, never by colour alone: a quiet dot while it
 * asks, a tick for a new number, the warning for one already here, the note for a check that could
 * not answer — the server checks again at save, so it is information, not a fault.
 */
export const CHECK_TONE: Readonly<Record<QuickAddCheckLine['kind'], StatusTone>> = {
  checking: 'neutral',
  new: 'success',
  known: 'warning',
  unchecked: 'info',
};

/** The type's two segments, in domain's order (`M02-05`). */
export function segmentOptionsOf(words: QuickAddFormWords): SegmentedOption[] {
  return DEAL_SEGMENTS.map((segment) => ({ value: segment, label: words.segments[segment] }));
}

/** The segmented control hands back a string: one of the two segments, or nothing chosen. */
export function segmentOf(value: string): DealSegment | null {
  return DEAL_SEGMENTS.find((segment) => segment === value) ?? null;
}

/**
 * The panel or sheet the form sits in: it waits while the save is out and while the duplicate
 * sheet stands over it — both screens hold it alike.
 */
export function quickAddSurfaceOf(screen: QuickAddScreenFacts, words: QuickAddScreenWords) {
  return {
    open: screen.open,
    onClose: screen.close,
    closeLabel: words.close,
    showClose: true,
    title: words.title,
    dismissible: !screen.saving && screen.duplicate === null,
  };
}

/** The form over the capture and its words — both screens draw it alike; a retry saves again. */
export function quickAddFormPropsOf(
  screen: QuickAddScreenFacts,
  words: QuickAddScreenWords,
): QuickAddFormProps {
  return {
    ...screen.draft,
    onPhone: screen.setPhone,
    onName: screen.setName,
    onCity: screen.setCity,
    onSegment: screen.setSegment,
    check: words.check,
    phoneRefusal: words.phoneRefusal,
    phoneFocus: screen.phoneFocus,
    cameFrom: words.cameFrom,
    saving: screen.saving,
    returned: words.returned,
    onSave: screen.save,
    onRetry: screen.save,
    onDismissReturned: screen.dismissSaveFailure,
    words: words.form,
  };
}
