import { useCatalogFacts } from '@heliogrid/data/react';
import { CATALOG_SETTINGS } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { SegmentedControl, ToastHost, useToasts } from '@heliogrid/ui';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { underPill } from '../shell/styles';
import { ChangedItems } from './components/ChangedItems';
import { ItemsPanel } from './components/ItemsPanel';
import { RatesPanel } from './components/RatesPanel';

type Panel = 'items' | 'rates';

/**
 * Catalog settings behind `More` on the phone (`SCR-M01-15`, the 375 frames): the settings page's
 * bar with its way back, the *Items* / *Rates* switch, and the panel. The settings row opens it
 * once the person's presets allow (`F7-48`); without the outright grant every act is absent.
 */
export function CatalogSettingsScreen() {
  const drillDown = useSettingsDrillDown('catalog');
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<Panel>('items');
  const facts = useCatalogFacts();
  const toasts = useToasts();
  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      lead={
        /* A page that did not load is its error alone (s-error-load): nothing to switch between. */
        facts.read.kind === 'failed' ? undefined : (
          <SegmentedControl
            options={[
              { value: 'items', label: t(CATALOG_SETTINGS.items) },
              { value: 'rates', label: t(CATALOG_SETTINGS.rates) },
            ]}
            value={panel}
            onChange={(value) => setPanel(value === 'rates' ? 'rates' : 'items')}
          />
        )
      }
    >
      {panel === 'items' ? (
        <ItemsPanel facts={facts} toasts={toasts} />
      ) : (
        <>
          <RatesPanel administers={facts.administers} toasts={toasts} />
          <ChangedItems total={facts.allCount} />
        </>
      )}
      {/* Above the pill, which stands on the device's home-bar inset — the package reads no inset. */}
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        offset={underPill(insets.bottom) + theme.spacing['sp-6']}
      />
    </ShellPage>
  );
}
