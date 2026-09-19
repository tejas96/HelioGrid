import { usePushRegistration } from '../push/usePushRegistration';
import { linkingOptions } from './linking';
import { NavigationPhaseProvider } from './phase';
import { Navigation } from './root';

/**
 * The ONE thing App.tsx renders.
 *
 * Push registration is mounted HERE, once, for the same reason the phase provider is: a screen
 * that did it would bind and unbind as it came and went, and two screens doing it would race for
 * one token (`F6-13`).
 *
 * Composing the provider here rather than in App.tsx means a caller cannot forget it — and
 * forgetting it would leave every guard reading the context default ('booting') forever,
 * which looks like a hung splash rather than a missing provider. The linking options ride
 * along for the same reason: the entry file neither knows nor can omit them.
 */
export function AppNavigation() {
  usePushRegistration();
  return (
    <NavigationPhaseProvider>
      <Navigation linking={linkingOptions} />
    </NavigationPhaseProvider>
  );
}
