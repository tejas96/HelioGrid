'use client';
import type { CatalogOverlays } from '@heliogrid/data/react';
import {
  CATALOG_EDITOR,
  CATALOG_FIGURES,
  catalogEditedItemOf,
  catalogPriceEditorWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Button,
  type CatalogEditorOwnActs,
  CatalogPriceEditor,
  catalogEditorSwitches,
  EmptyState,
  useCatalogFormats,
} from '@heliogrid/ui';
import { Foot } from './ItemsOverlays';

/**
 * The desktop's price editor, docked beside the list (`SCR-M01-15`, list plus side panel): the
 * picked row's specs and price, saved here, while the list stays whole and reachable. Before a row
 * is picked it says where the detail opens. The phone and narrow windows keep the sheet.
 */
export function PriceEditorDock({
  overlays,
  schemes,
  onPriceSaved,
  ownActs,
}: {
  overlays: CatalogOverlays;
  schemes: readonly string[];
  onPriceSaved: (name: string) => void;
  /** An own SKU's *Prefer* and *Archive*, done at once as its row did them. */
  ownActs: CatalogEditorOwnActs | null;
}) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const { draft } = overlays;
  const item = draft.item;
  if (item === null) {
    return (
      <aside className="hg-catalog-dock" data-empty="true">
        <EmptyState
          moment="empty-catalog"
          title={t(CATALOG_FIGURES.pickTitle)}
          description={t(CATALOG_FIGURES.pickLine)}
        />
      </aside>
    );
  }
  const platform = item.source === 'platform_item';
  const name = `${item.brand} ${item.model}`;
  return (
    <aside className="hg-catalog-dock" aria-label={name}>
      <CatalogPriceEditor
        words={catalogPriceEditorWords(
          t,
          platform && draft.taxPct !== '' ? formats.percent(draft.taxPct) : null,
        )}
        item={catalogEditedItemOf(t, item, schemes, formats)}
        amount={draft.amount}
        onAmount={draft.setAmount}
        taxPct={platform ? draft.taxPct : null}
        onTaxPct={draft.setTaxPct}
        taxOverridden={draft.taxPct !== ''}
        packRateMissing={item.tax?.source !== 'pack'}
        switches={platform ? catalogEditorSwitches(draft) : null}
        ownActs={ownActs}
        problem={draft.problem === null ? null : t(CATALOG_EDITOR.saveFailed)}
      />
      <Foot cancel={{ label: t(CATALOG_EDITOR.cancel), variant: 'ghost' }} onCancel={draft.close}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={draft.pending}
          onClick={() => {
            void draft.save().then((saved) => {
              if (saved) onPriceSaved(name);
            });
          }}
        >
          {t(CATALOG_EDITOR.savePrice)}
        </Button>
      </Foot>
    </aside>
  );
}
