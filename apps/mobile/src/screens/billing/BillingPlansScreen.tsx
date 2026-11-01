import { BILLING_HOME, PRICING } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useNavigation } from '@react-navigation/native';
import { ComingLaterPage } from '../settings/components/ComingLaterPage';

/**
 * The plans (`SCR-M12-03`), opened by `Change plan` and the trial's `Pick a plan`: until its task
 * lands it is the settings rows' *coming later* page, under the plans page's own bar — its title
 * and the way back to billing it came from.
 */
export function BillingPlansScreen() {
  const t = useTranslate();
  const navigation = useNavigation();
  return (
    <ComingLaterPage
      drillDown={{
        title: t(PRICING.plans),
        back: t(BILLING_HOME.backToBilling),
        onBack: () => navigation.goBack(),
      }}
    />
  );
}
