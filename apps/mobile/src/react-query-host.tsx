import { addEventListener as addNetInfoListener } from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

let installationCount = 0;

function installHostListeners(): () => void {
  focusManager.setEventListener((setFocused) => {
    setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      setFocused(state === 'active');
    });
    return () => subscription.remove();
  });
  onlineManager.setEventListener((setOnline) =>
    addNetInfoListener((state) => {
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    }),
  );

  return () => {
    focusManager.setEventListener(() => undefined);
    focusManager.setFocused(undefined);
    onlineManager.setEventListener(() => undefined);
    onlineManager.setOnline(true);
  };
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
