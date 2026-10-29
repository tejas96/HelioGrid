'use client';
import { type CatalogFacts, useCatalogItemsPanel } from '@heliogrid/data/react';
import { catalogActToast, catalogItemAddedToast, catalogItemsViewOf } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogItems, catalogRowStatesOf, useCatalogFormats, type useToasts } from '@heliogrid/ui';
import { useRef } from 'react';
import { AddItemPanel } from './AddItemPanel';
import { ImportPanel } from './ImportPanel';
import { ItemsOverlays } from './ItemsOverlays';

/**
 * The Items panel on the web (`SCR-M01-15`): one numbered page of the resolved catalog, its search,
 * filters and order, and every row act. What it draws is `useCatalogItemsPanel`'s, the phone's
 * too; `catalogItemsViewOf` words it.
 */
export function ItemsPanel({
  facts,
  toasts,
}: {
  facts: CatalogFacts;
  toasts: ReturnType<typeof useToasts>;
}) {
  const { t } = useI18n();
  /* An undone archive brings its row back into this list; focus lands on the list. */
  const list = useRef<HTMLDivElement>(null);
  const formats = useCatalogFormats();
  const panel = useCatalogItemsPanel(facts, 'pages', {
    act: (note) => {
      const toast = catalogActToast(t, note);
      toasts.push(
        toast.undo === undefined ? toast : { ...toast, undo: { ...toast.undo, focusAfter: list } },
      );
    },
    added: (item) => toasts.push(catalogItemAddedToast(t, `${item.brand} ${item.model}`)),
  });
  const { view, overlays, acts, onItem } = panel;
  const shown = catalogItemsViewOf(t, panel.listed, formats);

  return (
    <>
      <div ref={list} tabIndex={-1} className="hg-focus-target">
        <CatalogItems
          words={shown.words}
          read={panel.read}
          strip={{
            ...shown.strip,
            /* *Publish* is hidden while the add panel lies over the list (`SCR-M01-16`). */
            action: panel.adding ? null : shown.strip.action,
            onLink: overlays.openReleases,
            onAction: overlays.openPublish,
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
          onOpen={onItem(overlays.openEditor)}
          onPrefer={onItem(acts.togglePreferred)}
          onHide={onItem(acts.toggleHidden)}
          onArchive={onItem((item) => void overlays.askArchive(item))}
          onRestore={onItem(acts.restore)}
        />
      </div>
      <ItemsOverlays overlays={overlays} schemes={facts.schemes} release={facts.release} />
      {panel.importing ? <ImportPanel onClose={panel.closeImport} /> : null}
      {panel.adding ? (
        <AddItemPanel
          priced={facts.administers}
          onClose={panel.closeAdd}
          onAdded={panel.itemAdded}
          onSpreadsheet={panel.addFromSpreadsheet}
        />
      ) : null}
    </>
  );
}
