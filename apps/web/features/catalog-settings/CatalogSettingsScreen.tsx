'use client';
import { useCatalogFacts, useSession } from '@heliogrid/data/react';
import { opensSettingsRow } from '@heliogrid/domain';
import { CATALOG_SETTINGS } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  DATA_TABLE_STACK_BELOW,
  SegmentedControl,
  Tabs,
  Text,
  ToastHost,
  useOwnWidth,
  useToasts,
} from '@heliogrid/ui';
import { notFound } from 'next/navigation';
import { useState } from 'react';
import { ChangedItems } from './components/ChangedItems';
import { ItemsPanel } from './components/ItemsPanel';
import { RatesPanel } from './components/RatesPanel';

import './catalog-settings.css';

type Panel = 'items' | 'rates';

/**
 * Catalog settings behind `More` on the web (`SCR-M01-15`): one destination, two panels — *Items*,
 * the resolved catalog, and *Rates*, the price book — switched by tabs in the page head at the
 * table's width and a segmented control below it (brief decision 1). Only a person whose presets
 * open the Catalog row reaches it (`F7-48`); without the outright grant every act is absent.
 */
export function CatalogSettingsScreen() {
  const { user } = useSession();
  if (!opensSettingsRow(user?.tenant?.roles ?? [], 'catalog')) notFound();
  return <CatalogIn />;
}

function CatalogIn() {
  const { t } = useI18n();
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= DATA_TABLE_STACK_BELOW;
  const [panel, setPanel] = useState<Panel>('items');
  const facts = useCatalogFacts();
  const toasts = useToasts();
  const options = [
    {
      value: 'items',
      label: t(CATALOG_SETTINGS.items),
      count: facts.read.kind === 'ready' ? facts.allCount : undefined,
    },
    { value: 'rates', label: t(CATALOG_SETTINGS.rates) },
  ];
  const choose = (value: string) => setPanel(value === 'rates' ? 'rates' : 'items');

  /* A page that did not load is its error alone (s-error-load): nothing to switch between. */
  const switchable = facts.read.kind !== 'failed';
  return (
    <div className="hg-shell-page hg-catalog-page" ref={room}>
      <header className="hg-catalog-head">
        <Text as="h1" variant="h2">
          {t(CATALOG_SETTINGS.title)}
        </Text>
        {wide && switchable ? <Tabs tabs={options} value={panel} onChange={choose} /> : null}
      </header>
      {wide || !switchable ? null : (
        <SegmentedControl options={options} value={panel} onChange={choose} />
      )}
      {panel === 'items' ? (
        <ItemsPanel facts={facts} toasts={toasts} />
      ) : (
        <>
          <RatesPanel administers={facts.administers} toasts={toasts} />
          {wide ? null : <ChangedItems total={facts.allCount} />}
        </>
      )}
      <ToastHost toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}
