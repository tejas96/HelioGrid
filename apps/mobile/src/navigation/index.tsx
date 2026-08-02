import { linkingOptions } from './linking';
import { NavigationPhaseProvider } from './phase';
import { Navigation } from './root';

/**
 * The ONE thing App.tsx renders.
 *
 * Composing the provider here rather than in App.tsx means a caller cannot forget it — and
 * forgetting it would leave every guard reading the context default ('booting') forever,
 * which looks like a hung splash rather than a missing provider. The linking options ride
 * along for the same reason: the entry file neither knows nor can omit them.
 */
export function AppNavigation() {
  return (
    <NavigationPhaseProvider>
      <Navigation linking={linkingOptions} />
    </NavigationPhaseProvider>
  );
}
