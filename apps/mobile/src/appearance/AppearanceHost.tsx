import type { Appearance } from '@heliogrid/domain';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { StatusBar, Appearance as SystemAppearance, useColorScheme } from 'react-native';
import { keepAppearance, readAppearance } from './appearance-storage';

interface AppearanceChoice {
  readonly appearance: Appearance;
  readonly choose: (next: Appearance) => void;
}

const AppearanceContext = createContext<AppearanceChoice | null>(null);

/** `device` hands the scheme back to the system; light or dark overrides it for this app. */
function applyToSystem(appearance: Appearance): void {
  SystemAppearance.setColorScheme(appearance === 'device' ? 'unspecified' : appearance);
}

/**
 * The ONE place the phone's appearance lives: it restores the kept choice at launch, applies a new
 * one as it is touched, and sets the status bar's icons to the scheme on screen. Colours follow on
 * their own — every one is a system colour (`packages/ui`'s `Color` primitive): iOS changes them in
 * place, and Android restarts the activity on a night-mode change (`AndroidManifest.xml`).
 */
export function AppearanceHost({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>('device');
  const scheme = useColorScheme();
  useEffect(() => {
    void readAppearance().then((kept) => {
      setAppearance(kept);
      applyToSystem(kept);
    });
  }, []);
  const choose = useCallback((next: Appearance) => {
    setAppearance(next);
    applyToSystem(next);
    void keepAppearance(next);
  }, []);
  return (
    <AppearanceContext.Provider value={{ appearance, choose }}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceChoice {
  const choice = useContext(AppearanceContext);
  if (choice === null) throw new Error('useAppearance needs AppearanceHost above it (App.tsx)');
  return choice;
}
