import type { ReactNode } from 'react';
import {
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
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
/** The host's own view: the box every layer is laid out in, so a layer measures against it. */
const HostViewContext = createContext<RefObject<View | null> | null>(null);

/**
 * Mount ONE PortalHost at the app root (above navigation). Every Portal below it renders
 * into an absolute-fill layer on top of the host's children — sheets, modals, menus and
 * tooltips all escape their screen through here.
 */
export function PortalHost({ children, bottomInset = 0 }: PortalHostProps) {
  const [portals, setPortals] = useState<readonly PortalEntry[]>([]);
  const hostView = useRef<View>(null);
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
        <HostViewContext.Provider value={hostView}>
          <View ref={hostView} style={styles.host}>
            {children}
            {portals.map((entry, index) => (
              <View key={entry.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <CoveredContext.Provider value={index < portals.length - 1}>
                  {entry.node}
                </CoveredContext.Provider>
              </View>
            ))}
          </View>
        </HostViewContext.Provider>
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

/** Where a box stands, in the coordinates a layer drawn into the host is placed by. */
export interface LayerRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What a layer can be anchored to: a view, or anything that measures as one. */
export type LayerTarget = Pick<View, 'measureInWindow'>;

/**
 * The panel a sheet or a side panel slides in on, given to what it holds. Its slide runs on the
 * native driver, and React Native's layout keeps the panel where the slide began until it ends.
 */
const SlidingPanelContext = createContext<RefObject<View | null> | null>(null);

/** A sliding panel's content: what it holds is measured where the panel comes to rest. */
export function SlidingPanel({
  panel,
  children,
}: {
  panel: RefObject<View | null>;
  children: ReactNode;
}) {
  return <SlidingPanelContext.Provider value={panel}>{children}</SlidingPanelContext.Provider>;
}

/**
 * Measure `target` for a layer drawn over it — a list, a menu, a bubble — where it will REST.
 * `measureInWindow` gives the place with every scroll and transform in it, but a sheet sliding in
 * on the native driver leaves its panel's transform where the slide began until the slide ends, so
 * a list opened while the sheet came in hung below the screen. Inside a sliding panel, the panel's
 * own slide and scale are taken back out: from its place in the window to its laid-out place in the
 * host. Every scroll inside the panel stays in.
 */
export function useMeasureForLayer(): (
  target: LayerTarget | null,
  done: (rect: LayerRect) => void,
) => void {
  const host = useContext(HostViewContext);
  const sliding = useContext(SlidingPanelContext);
  return useCallback(
    (target: LayerTarget | null, done: (rect: LayerRect) => void) => {
      if (target === null) return;
      target.measureInWindow((x, y, w, h) => {
        const panel = sliding?.current ?? null;
        const hostView = host?.current ?? null;
        if (panel === null || hostView === null) return done({ x, y, w, h });
        panel.measureInWindow((shownX, shownY, shownW) => {
          panel.measureLayout(
            hostView,
            (restX, restY, restW) => {
              /* The panel may grow as it opens (`Modal`): its scale maps the target back too. */
              const scale = shownW > 0 && restW > 0 ? shownW / restW : 1;
              done({
                x: restX + (x - shownX) / scale,
                y: restY + (y - shownY) / scale,
                w: w / scale,
                h: h / scale,
              });
            },
            () => done({ x, y, w, h }),
          );
        });
      });
    },
    [host, sliding],
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
