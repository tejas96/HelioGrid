'use client';
import { type CatalogFacts, useCatalogItemsPanel } from '@heliogrid/data/react';
import {
  CATALOG_FIGURES,
  catalogActToast,
  catalogItemAddedToast,
  catalogItemsViewOf,
  catalogStripFigures,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  CatalogItems,
  catalogEditorOwnActs,
  catalogRowStatesOf,
  useCatalogFormats,
  useDesktopShell,
  useFormat,
  type useToasts,
} from '@heliogrid/ui';
import { useRef } from 'react';
import { AddItemPanel } from './AddItemPanel';
import { ImportPanel } from './ImportPanel';
import { ItemsOverlays } from './ItemsOverlays';
import { PriceEditorDock } from './PriceEditorDock';

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
  const format = useFormat();
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
  /* From the desktop width the editor is docked beside the list; below it, a sheet over it. */
  const docked = useDesktopShell() === true;
  const priceSaved = (name: string) =>
    toasts.push({
      tone: 'success',
      title: t(CATALOG_FIGURES.priceSaved),
      description: name,
      moment: 'saved',
    });
  const shown = catalogItemsViewOf(t, panel.listed, formats);
  /* An own SKU's *Prefer* and *Archive* in its editor, as its row did them (direction A). */
  const ownActs = catalogEditorOwnActs(overlays.draft.item, shown.rows, {
    onPrefer: onItem(acts.togglePreferred),
    onArchive: onItem((item) => void overlays.askArchive(item)),
    close: overlays.draft.close,
  });
  const figures = catalogStripFigures(
    t,
    { all: facts.allCount, changed: facts.changedCount, archived: facts.archivedCount },
    (n) => format.number(n),
  );

  return (
    <>
      <div className="hg-catalog-split" data-docked={docked ? 'true' : undefined}>
        <div ref={list} tabIndex={-1} className="hg-focus-target hg-catalog-list">
          <CatalogItems
            words={shown.words}
            read={panel.read}
            strip={{
              ...shown.strip,
              figures,
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
            kindCounts={facts.kindCounts}
            rowStates={catalogRowStatesOf(shown.statuses, acts.rows)}
            paging={panel.paging}
            archivedCaption={shown.archivedCaption}
            administers={facts.administers}
            onImport={panel.openImport}
            onAdd={panel.openAdd}
            addedId={panel.addedId}
            openedId={docked ? (overlays.draft.item?.id ?? null) : null}
            onOpen={onItem(overlays.openEditor)}
            onPrefer={onItem(acts.togglePreferred)}
            onHide={onItem(acts.toggleHidden)}
            onArchive={onItem((item) => void overlays.askArchive(item))}
            onRestore={onItem(acts.restore)}
          />
        </div>
        {docked ? (
          <PriceEditorDock
            overlays={overlays}
            schemes={facts.schemes}
            onPriceSaved={priceSaved}
            ownActs={ownActs}
          />
        ) : null}
      </div>
      <ItemsOverlays
        overlays={overlays}
        schemes={facts.schemes}
        release={facts.release}
        onPriceSaved={priceSaved}
        ownActs={ownActs}
        docked={docked}
      />
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
