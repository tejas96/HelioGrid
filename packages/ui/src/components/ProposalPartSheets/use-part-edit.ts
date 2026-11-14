import type { ComponentLine } from '@heliogrid/domain';
import type { PartEditWords } from './ProposalPartSheets.types';
import { partDescriptionField, partFactFields } from './sheet-fields';
import { useSheetDraft } from './use-sheet-draft';

/**
 * *Edit what prints* (`M06-29`): the line as the person has it now, its print facts as fields and
 * the one line for the customer — `null` while the sheet is shut. Nothing leaves it until *Done*.
 */
export function usePartEdit(open: boolean, given: ComponentLine | null, words: PartEditWords) {
  const [line, setLine] = useSheetDraft(open, given);
  if (line === null) return null;
  return {
    line,
    facts: partFactFields(line, words, setLine),
    description: partDescriptionField(line, words, setLine),
  };
}

export type PartEditing = NonNullable<ReturnType<typeof usePartEdit>>;
