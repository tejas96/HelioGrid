'use client';
import type { PriceBookDraft } from '@heliogrid/data/react';
import { catalogVersionWords, PRICE_BOOK, rateSheetWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { Button, CatalogRateEdit, EditorSurface } from '@heliogrid/ui';

/**
 * The rate sheet over the new-version editor (owner ruling 2026-10-24): a modal at 1536, a sheet
 * at 375. *Done* waits for an English name; *Cancel* leaves the draft as it was.
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
      desktop="modal"
      size="auto"
      zIndex={50}
      title={words?.title}
      footer={
        <div className="hg-catalog-foot">
          <Button variant="secondary" size="lg" fullWidth onClick={draft.cancelEdit}>
            {words?.cancel ?? ''}
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={editing?.nameless ?? true}
            onClick={draft.doneEdit}
          >
            {words?.done ?? ''}
          </Button>
        </div>
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
