import { useShell } from '@heliogrid/data/react';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { BottomNav, useKeyboardUp } from '@heliogrid/ui';
import { CommonActions } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationRef } from '../../../navigation/ref';
import { tabRoute } from '../doors';
import { type PillSlot, usePillActionRef, usePillSlot } from '../pill-slot';
import { pillFrameBottom, styles } from '../styles';
import { doorTarget, type PillDoor } from '../use-open-tab';
import { usePillItems } from '../use-pill-items';

/**
 * The one pill (`SCR-SHELL-01`), drawn once over every page beside the navigator, so it never
 * redraws with a page and stays still while a page slides in over the tabs. It shows while a shell
 * page is in front (`useClaimPill`) and steps aside while the keyboard is up, so it never covers the
 * field being typed in. A tap lights its item in the same frame, before the page it opens is drawn.
 */
export function PillHost() {
  const slot = usePillSlot();
  if (slot === null) return null;
  return <Pill slot={slot} />;
}

function Pill({ slot }: { slot: PillSlot }) {
  const t = useTranslate();
  const shell = useShell();
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardUp();
  const actionRef = usePillActionRef();
  /* The item a tap lit, held only while the page it was tapped on is still the one in front: once
     the page it opened claims the pill, that page says which item is in view. */
  // biome-ignore lint/plugin/screen-assembly: a React Native adapter — the item a tap lit before its page is drawn; no data and nothing the web draws
  const [pressed, setPressed] = useState<{ key: string; on: PillSlot } | null>(null);
  const open = (door: PillDoor) => {
    if (door in tabRoute) setPressed({ key: door, on: slot });
    /* The light is drawn first; the page it opens is drawn in the next frame. */
    requestAnimationFrame(() => {
      if (!navigationRef.isReady()) return;
      const target = doorTarget(door);
      navigationRef.dispatch(CommonActions.navigate(target.name, target.params, target.options));
    });
  };
  const items = usePillItems(shell, actionRef, slot.act, open);
  if (items.length === 0 || keyboardUp) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.pillFrame, { bottom: pillFrameBottom(insets.bottom) }]}
    >
      <BottomNav
        label={t(SHELL.mainNavigation)}
        items={items}
        value={pressed?.on === slot ? pressed.key : slot.inView}
      />
    </View>
  );
}
