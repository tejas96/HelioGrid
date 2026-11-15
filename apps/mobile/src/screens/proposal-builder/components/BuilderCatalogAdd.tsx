import type { ProposalBuilderScreen } from '@heliogrid/data/react';
import { AddItemSheet, ImportSheet } from '../../catalog-settings';

/**
 * *Add a new part* from step 8's picker for a panel, an inverter or a battery (`M06-28`), never a
 * dead end: it is a catalog ITEM, so the catalog's own add form opens here on that kind and the
 * item it saves is picked in place; its spreadsheet row opens the catalog's import over step 8,
 * as the web does — the builder is never left for Catalog settings.
 */
export function BuilderCatalogAdd({ screen }: { screen: ProposalBuilderScreen }) {
  const { parts, detail } = screen;
  if (parts.catalogKind === null) return null;
  if (parts.importing) return <ImportSheet onClose={parts.closeImport} />;
  return parts.adding ? (
    <AddItemSheet
      kind={parts.catalogKind}
      caller="picker"
      priced={detail?.rights.managesParts === true}
      onClose={parts.closeAdd}
      onAdded={(item) => parts.pickAdded(item.id)}
      onSpreadsheet={parts.openImport}
    />
  ) : null;
}
