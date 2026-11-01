import { PricingScreen } from '../../../features/pricing';

/**
 * Route entry for /pricing — routing only. In the open group: a prospect reads it before any
 * account exists, and a signed-in owner may read it too (`SCR-M12-01` decision 1).
 */
export default function PricingPage() {
  return <PricingScreen />;
}
