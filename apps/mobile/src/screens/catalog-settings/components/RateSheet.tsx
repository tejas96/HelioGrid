import type { PriceBookDraft } from '@heliogrid/data/react';
import { catalogVersionWords, PRICE_BOOK, rateSheetWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogRateEdit, EditorSurface } from '@heliogrid/ui';
import { SheetFoot } from './SheetFoot';

/**
 * The rate sheet over the new-version sheet on the phone (owner ruling 2026-10-24). *Done* waits
 * for an English name; *Cancel* leaves the draft as it was.
 */
export function RateSheet({ draft }: { draft: PriceBookDraft }) {
  const { t } = useI18n();
  const editing = draft.editing;
  const words = editing === null ? null : rateSheetWords(t, editing.rate, editing.added);
  return (
    <EditorSurface
      open={editing !== null}
      onClose={draft.cancelEdit}
      closeLabel={t(PRICE_BOOK.close)}
      showClose
      size="auto"
      zIndex={50}
      title={words?.title}
      footer={
        <SheetFoot
          cancel={words?.cancel ?? ''}
          onCancel={draft.cancelEdit}
          act={words?.done ?? ''}
          onAct={draft.doneEdit}
          off={editing?.nameless ?? true}
        />
      }
    >
      {editing === null || words === null ? null : (
        <CatalogRateEdit
          names={words.names}
          onName={draft.setEditName}
          basis={editing.rate.basis}
          basisLabel={words.basis}
          bases={catalogVersionWords(t).bases}
          onBasis={draft.setEditBasis}
          remove={
            words.remove === null ? null : { label: words.remove, onRemove: draft.removeEdited }
          }
        />
      )}
    </EditorSurface>
  );
}
