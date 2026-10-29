import { type CatalogFacts, useCatalogItemsPanel } from '@heliogrid/data/react';
import { catalogActToast, catalogItemAddedToast, catalogItemsViewOf } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogItems, catalogRowStatesOf, useCatalogFormats, type useToasts } from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { AddItemSheet } from './AddItemSheet';
import { ImportSheet } from './ImportSheet';
import { ItemsSheets } from './ItemsSheets';

/**
 * The Items panel on the phone (`SCR-M01-15`): the resolved catalog as cards that load as the
 * person scrolls, its search and filters, and every row act. The phone's list grows where the
 * web's pages; everything else — the reads, the acts, the words — is `useCatalogItemsPanel`'s and
 * `catalogItemsViewOf`'s, the web's too.
 */
export function ItemsPanel({
  facts,
  toasts,
}: {
  facts: CatalogFacts;
  toasts: ReturnType<typeof useToasts>;
}) {
  const { t } = useI18n();
  /* An undone archive brings its row back into this list; the reader lands on the list. */
  const list = useRef<View>(null);
  const formats = useCatalogFormats();
  const panel = useCatalogItemsPanel(facts, 'scroll', {
    act: (note) => {
      const toast = catalogActToast(t, note);
      toasts.push(
        toast.undo === undefined ? toast : { ...toast, undo: { ...toast.undo, focusAfter: list } },
      );
    },
    added: (item) => toasts.push(catalogItemAddedToast(t, `${item.brand} ${item.model}`)),
  });
  const { view, overlays: sheets, acts, onItem } = panel;
  const shown = catalogItemsViewOf(t, panel.listed, formats);

  return (
    <>
      <View ref={list}>
        <CatalogItems
          words={shown.words}
          read={panel.read}
          strip={{
            ...shown.strip,
            action: panel.adding ? null : shown.strip.action,
            onLink: sheets.openReleases,
            onAction: sheets.openPublish,
          }}
          viewOnly={shown.viewOnly}
          teaching={shown.teaching}
          query={view.q}
          onQuery={(q) => panel.change({ q })}
          filter={view.filter}
          onFilter={(filter) => panel.change({ filter })}
          sort={view.sort}
          onSort={(sort) => panel.change({ sort })}
          schemes={facts.schemes}
          rows={shown.rows}
          rowStates={catalogRowStatesOf(shown.statuses, acts.rows)}
          paging={panel.paging}
          archivedCaption={shown.archivedCaption}
          administers={facts.administers}
          onImport={panel.openImport}
          onAdd={panel.openAdd}
          addedId={panel.addedId}
          onOpen={onItem(sheets.openEditor)}
          onPrefer={onItem(acts.togglePreferred)}
          onHide={onItem(acts.toggleHidden)}
          onArchive={onItem((item) => void sheets.askArchive(item))}
          onRestore={onItem(acts.restore)}
        />
      </View>
      <ItemsSheets sheets={sheets} schemes={facts.schemes} release={facts.release} />
      {panel.importing ? <ImportSheet onClose={panel.closeImport} /> : null}
      {panel.adding ? (
        <AddItemSheet
          priced={facts.administers}
          onClose={panel.closeAdd}
          onAdded={panel.itemAdded}
          onSpreadsheet={panel.addFromSpreadsheet}
        />
      ) : null}
    </>
  );
}
