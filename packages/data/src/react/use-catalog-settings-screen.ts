'use client';
import { opensSettingsRow } from '@heliogrid/domain';
import { useState } from 'react';
import { type CatalogFacts, useCatalogFacts } from './use-catalog-items';
import { useSession } from './use-session';

/** Catalog settings' two panels: *Items*, the resolved catalog, and *Rates*, the price book. */
export type CatalogPanel = 'items' | 'rates';

/**
 * Catalog settings (`SCR-M01-15`) as both screens draw it, assembled once (Law 11, `F7-30`): the
 * page's facts and which panel is shown. Each panel assembles its own part, so it starts afresh
 * each time it is shown.
 */
export interface CatalogSettingsScreen {
  /** The person's presets open the Catalog row (`F7-48`); the web answers not found without. */
  readonly allowed: boolean;
  readonly facts: CatalogFacts;
  readonly panel: CatalogPanel;
  /** A page that did not load is its error alone (s-error-load): nothing to switch between. */
  readonly switchable: boolean;
  /** The *Items* figure once the page's facts are in; none while they are out or failed. */
  readonly itemsCount: number | undefined;
  /** Takes a switch's value: anything but *Rates* shows *Items*. */
  choosePanel(value: string): void;
}

export function useCatalogSettingsScreen(): CatalogSettingsScreen {
  const { user } = useSession();
  const facts = useCatalogFacts();
  const [panel, setPanel] = useState<CatalogPanel>('items');
  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'catalog'),
    facts,
    panel,
    switchable: facts.read.kind !== 'failed',
    itemsCount: facts.read.kind === 'ready' ? facts.allCount : undefined,
    choosePanel: (value) => setPanel(value === 'rates' ? 'rates' : 'items'),
  };
}
