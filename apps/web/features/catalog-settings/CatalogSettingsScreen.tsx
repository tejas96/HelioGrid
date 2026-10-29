'use client';
import {
  type CatalogSettingsScreen as CatalogSettings,
  useCatalogSettingsScreen,
} from '@heliogrid/data/react';
import { CATALOG_SETTINGS, toastHostWords } from '@heliogrid/i18n';
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
import { ChangedItems } from './components/ChangedItems';
import { ItemsPanel } from './components/ItemsPanel';
import { RatesPanel } from './components/RatesPanel';

import './catalog-settings.css';

/**
 * Catalog settings behind `More` on the web (`SCR-M01-15`): one destination, two panels — *Items*,
 * the resolved catalog, and *Rates*, the price book — switched by tabs in the page head at the
 * table's width and a segmented control below it (brief decision 1). Only a person whose presets
 * open the Catalog row reaches it (`F7-48`); without the outright grant every act is absent. What
 * it draws is `useCatalogSettingsScreen`'s, the phone's too.
 */
export function CatalogSettingsScreen() {
  const screen = useCatalogSettingsScreen();
  if (!screen.allowed) notFound();
  return <CatalogIn screen={screen} />;
}

function CatalogIn({ screen }: { screen: CatalogSettings }) {
  const { t } = useI18n();
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= DATA_TABLE_STACK_BELOW;
  const { facts, panel, switchable, choosePanel } = screen;
  const toasts = useToasts();
  const options = [
    { value: 'items', label: t(CATALOG_SETTINGS.items), count: screen.itemsCount },
    { value: 'rates', label: t(CATALOG_SETTINGS.rates) },
  ];

  return (
    /* A closed toast hands the keyboard back to the page it spoke about. */
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-catalog-page hg-focus-target">
      <header className="hg-catalog-head">
        <Text as="h1" variant="h2">
          {t(CATALOG_SETTINGS.title)}
        </Text>
        {wide && switchable ? <Tabs tabs={options} value={panel} onChange={choosePanel} /> : null}
      </header>
      {wide || !switchable ? null : (
        <SegmentedControl options={options} value={panel} onChange={choosePanel} />
      )}
      {panel === 'items' ? (
        <ItemsPanel facts={facts} toasts={toasts} />
      ) : (
        <>
          <RatesPanel administers={facts.administers} toasts={toasts} />
          {wide ? null : <ChangedItems total={facts.allCount} />}
        </>
      )}
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={room}
      />
    </div>
  );
}
