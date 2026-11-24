import { useFocusEffect } from '@react-navigation/native';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { View } from 'react-native';

/** What the page in front asks of the one pill: the destination it is, and its own action. */
export interface PillSlot {
  /** The pill's item this page is, or none on a page the pill does not name. */
  readonly inView: string | undefined;
  /** The page the action itself opened runs it again in place (quick add after a save). */
  readonly act: (() => void) | undefined;
}

/** What a page may do with the one pill: claim it, and point at its action. Never changes. */
interface PillClaims {
  readonly claim: (owner: symbol, slot: PillSlot | null) => void;
  /** The pill's action, where the home's first-run mark points (`FirstRunMark`). */
  readonly actionRef: RefObject<View | null>;
}

/* Two contexts: the pages hold only the claims, which never change, so a claim redraws the pill
   alone — a page that read the slot would redraw every loaded tab on each switch. */
const PillClaimsContext = createContext<PillClaims | null>(null);
const PillSlotContext = createContext<PillSlot | null>(null);

function usePillClaims(): PillClaims {
  const claims = useContext(PillClaimsContext);
  if (claims === null) {
    throw new Error('The pill needs PillSlotProvider above it (navigation/index)');
  }
  return claims;
}

/**
 * The one pill's state, beside the navigator: the page in front claims it while focused, so the
 * pill is drawn once over every page and never redrawn with a page (`PillHost`). A page leaving
 * gives back only its own claim, whichever of the two pages' focus and blur runs first.
 */
export function PillSlotProvider({ children }: { children: ReactNode }) {
  // biome-ignore lint/plugin/screen-assembly: navigation glue, not a screen's state — which page in front holds the one pill; no data and nothing the web draws
  const [held, setHeld] = useState<{ owner: symbol; slot: PillSlot } | null>(null);
  const actionRef = useRef<View>(null);
  const claim = useCallback((owner: symbol, slot: PillSlot | null) => {
    setHeld((current) => {
      if (slot !== null) return { owner, slot };
      return current?.owner === owner ? null : current;
    });
  }, []);
  const claims = useMemo(() => ({ claim, actionRef }), [claim]);
  return (
    <PillClaimsContext.Provider value={claims}>
      <PillSlotContext.Provider value={held?.slot ?? null}>{children}</PillSlotContext.Provider>
    </PillClaimsContext.Provider>
  );
}

/** The slot the page in front claimed, or none: no shell page is in front. Only the pill reads it. */
export function usePillSlot(): PillSlot | null {
  return useContext(PillSlotContext);
}

/** The pill's action button, for a mark that points at it. */
export function usePillActionRef(): RefObject<View | null> {
  return usePillClaims().actionRef;
}

/**
 * A shell page shows the pill while it is in front: `shown` false (no destinations, or an act bar
 * in the pill's place) claims nothing. The action is read when pressed, so a page's render never
 * claims again for a new function.
 */
export function useClaimPill(shown: boolean, inView: string | undefined, onAction?: () => void) {
  const { claim } = usePillClaims();
  const action = useRef(onAction);
  action.current = onAction;
  const hasAction = onAction !== undefined;
  useFocusEffect(
    useCallback(() => {
      if (!shown) return undefined;
      const owner = Symbol('pill');
      claim(owner, { inView, act: hasAction ? () => action.current?.() : undefined });
      return () => claim(owner, null);
    }, [claim, shown, inView, hasAction]),
  );
}
