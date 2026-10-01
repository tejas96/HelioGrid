import { followHostLifecycle } from '@heliogrid/data/react';
import { addEventListener as addNetInfoListener } from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState } from 'react-native';

let installationCount = 0;

/** The phone's focus is AppState's `active`; its network is NetInfo's reachability. */
function installHostListeners(): () => void {
  return followHostLifecycle({
    followFocus: (listener) => {
      listener(AppState.currentState === 'active');
      const subscription = AppState.addEventListener('change', (state) => {
        listener(state === 'active');
      });
      return () => subscription.remove();
    },
    followOnline: (listener) =>
      addNetInfoListener((state) => {
        listener(state.isConnected === true && state.isInternetReachable !== false);
      }),
  });
}

let removeHostListeners: (() => void) | undefined;

function acquireHostListeners(): () => void {
  installationCount += 1;
  removeHostListeners ??= installHostListeners();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    installationCount -= 1;
    if (installationCount === 0) {
      removeHostListeners?.();
      removeHostListeners = undefined;
    }
  };
}

/** Root host adapter: installs one Strict-Mode-safe focus/network bridge per mounted app. */
export function ReactQueryHost() {
  useEffect(acquireHostListeners, []);
  return null;
}
