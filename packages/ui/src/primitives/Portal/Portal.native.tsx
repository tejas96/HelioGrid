import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PortalHostProps, PortalProps } from './Portal.types';

interface PortalEntry {
  key: string;
  node: ReactNode;
}

interface PortalRegistry {
  mount: (key: string, node: ReactNode) => void;
  unmount: (key: string) => void;
}

const PortalContext = createContext<PortalRegistry | null>(null);
/** Read inside a layer: whether a layer opened after it is open now. */
const CoveredContext = createContext(false);
/** Apart from the registry, so a changed inset never remounts every open portal. */
const BottomInsetContext = createContext(0);

/**
 * Mount ONE PortalHost at the app root (above navigation). Every Portal below it renders
 * into an absolute-fill layer on top of the host's children — sheets, modals, menus and
 * tooltips all escape their screen through here.
 */
export function PortalHost({ children, bottomInset = 0 }: PortalHostProps) {
  const [portals, setPortals] = useState<readonly PortalEntry[]>([]);
  const registry = useMemo<PortalRegistry>(
    () => ({
      mount: (key, node) => {
        setPortals((current) => {
          const index = current.findIndex((entry) => entry.key === key);
          if (index === -1) {
            return [...current, { key, node }];
          }
          const next = [...current];
          next[index] = { key, node };
          return next;
        });
      },
      unmount: (key) => {
        setPortals((current) => current.filter((entry) => entry.key !== key));
      },
    }),
    [],
  );
  return (
    <PortalContext.Provider value={registry}>
      <BottomInsetContext.Provider value={bottomInset}>
        <View style={styles.host}>
          {children}
          {portals.map((entry, index) => (
            <View key={entry.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <CoveredContext.Provider value={index < portals.length - 1}>
                {entry.node}
              </CoveredContext.Provider>
            </View>
          ))}
        </View>
      </BottomInsetContext.Provider>
    </PortalContext.Provider>
  );
}

/**
 * Renders children into the nearest PortalHost. Without a host it renders IN PLACE — a
 * visible misplacement instead of a silent one, so the missing host gets fixed.
 */
export function Portal({ children }: PortalProps): ReactNode {
  const registry = useContext(PortalContext);
  const key = useId();
  /* A layer keeps its place in the stack while its content changes and leaves only when it closes:
     taken out and put back on every redraw, a layer drawn again — a mark measuring itself, a sheet
     whose field changed — would jump above every layer opened after it. */
  useEffect(() => {
    if (registry === null) {
      return;
    }
    return () => {
      registry.unmount(key);
    };
  }, [registry, key]);
  useEffect(() => {
    registry?.mount(key, children);
  }, [registry, key, children]);
  if (registry === null) {
    return children;
  }
  return null;
}

/**
 * Read by a layer's own content: whether a layer opened after it — a sheet, a modal, a menu — is
 * open now. Guidance drawn over a live screen steps aside while one is (`CoachMark`); `false`
 * outside a host.
 */
export function useCoveredByLaterLayer(): boolean {
  return useContext(CoveredContext);
}

/** The home-indicator band a float docked to the bottom edge must clear; 0 without a host. */
export function usePortalBottomInset(): number {
  return useContext(BottomInsetContext);
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
