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

/**
 * Mount ONE PortalHost at the app root (above navigation). Every Portal below it renders
 * into an absolute-fill layer on top of the host's children — sheets, modals, menus and
 * tooltips all escape their screen through here.
 */
export function PortalHost({ children }: PortalHostProps) {
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
      <View style={styles.host}>
        {children}
        {portals.map((entry) => (
          <View key={entry.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {entry.node}
          </View>
        ))}
      </View>
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
  useEffect(() => {
    if (registry === null) {
      return;
    }
    registry.mount(key, children);
    return () => {
      registry.unmount(key);
    };
  }, [registry, key, children]);
  if (registry === null) {
    return children;
  }
  return null;
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
