import { useCatalogSettingsScreen } from '@heliogrid/data/react';
import { CATALOG_SETTINGS, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { SegmentedControl, ToastHost, useToasts } from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { underPill } from '../shell/styles';
import { ChangedItems } from './components/ChangedItems';
import { ItemsPanel } from './components/ItemsPanel';
import { RatesPanel } from './components/RatesPanel';

/**
 * Catalog settings behind `More` on the phone (`SCR-M01-15`, the 375 frames): the settings page's
 * bar with its way back, the *Items* / *Rates* switch, and the panel. The settings row opens it
 * once the person's presets allow (`F7-48`); without the outright grant every act is absent. What it
 * draws is `useCatalogSettingsScreen`'s, the web's too.
 */
export function CatalogSettingsScreen() {
  const drillDown = useSettingsDrillDown('catalog');
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { facts, panel, switchable, choosePanel } = useCatalogSettingsScreen();
  const toasts = useToasts();
  /* A closed toast hands the screen reader back to the panel it spoke about. */
  const shown = useRef<View>(null);
  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      lead={
        switchable ? (
          <SegmentedControl
            options={[
              { value: 'items', label: t(CATALOG_SETTINGS.items) },
              { value: 'rates', label: t(CATALOG_SETTINGS.rates) },
            ]}
            value={panel}
            onChange={choosePanel}
          />
        ) : undefined
      }
    >
      {panel === 'items' ? (
        <View ref={shown}>
          <ItemsPanel facts={facts} toasts={toasts} />
        </View>
      ) : (
        <>
          <View ref={shown}>
            <RatesPanel administers={facts.administers} toasts={toasts} />
          </View>
          <ChangedItems total={facts.allCount} />
        </>
      )}
      {/* Above the pill, which stands on the device's home-bar inset — the package reads no inset. */}
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={shown}
        offset={underPill(insets.bottom) + theme.spacing['sp-6']}
      />
    </ShellPage>
  );
}
