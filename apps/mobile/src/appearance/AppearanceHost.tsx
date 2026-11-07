import type { Appearance } from '@heliogrid/domain';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform, StatusBar, Appearance as SystemAppearance, useColorScheme } from 'react-native';
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
 * their own — every one is a system colour (`packages/ui`'s `Color` primitive).
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

/**
 * Android resolves a resource colour when a view is drawn, and keeps it, so a scheme change must
 * redraw the views: the navigator is keyed by this and keeps its state across. iOS colours change
 * by themselves, so its key never moves.
 */
export function useRedrawKey(): string {
  const scheme = useColorScheme();
  return Platform.OS === 'android' ? (scheme ?? 'light') : 'system';
}
