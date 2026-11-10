import type { QuickAddScreen } from '@heliogrid/data/react';
import { quickAddDuplicateWords, quickAddSheetAct } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { DedupeSheet, useFormat } from '@heliogrid/ui';

/**
 * The duplicate sheet over the capture on the phone (`M02-08`, `M02-09`, `M02-66`), whether the
 * live check or the save met the number. It opens after the capture's sheet, so it stands above
 * it; closing it creates nothing and the capture is back with its typing.
 */
export function QuickAddDuplicateSheet({ screen }: { screen: QuickAddScreen }) {
  const t = useTranslate();
  const format = useFormat();
  const { duplicate } = screen;
  if (duplicate === null) return null;
  return (
    <DedupeSheet
      open
      onClose={screen.dismissDuplicate}
      record={duplicate.record}
      ownerName={duplicate.ownerName}
      stage={duplicate.stage}
      canKeepBoth={duplicate.canKeepBoth}
      act={quickAddSheetAct(t, screen.act)}
      onOpenExisting={screen.openExisting}
      onLogEnquiry={screen.logEnquiry}
      onKeepBoth={screen.keepBoth}
      words={quickAddDuplicateWords(t, duplicate, format.phone(screen.draft.phoneE164))}
    />
  );
}
