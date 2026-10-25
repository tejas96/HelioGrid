import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider';
import { ProgressRing } from '../OperationProgress/ProgressRing.native';
import { SHARE_RING } from '../OperationProgress/progress-ring';
import { HUE_INK, inkOver, RING_PRESSED_SHARE, WARNING_WORDS } from './ShareFilter.inks';
import { arcShare, totalOf } from './ShareFilter.logic';
import type { ShareFilterProps } from './ShareFilter.types';

type ShareRingsProps = Pick<ShareFilterProps, 'label' | 'items' | 'pressed' | 'onPress'>;

/**
 * `layout="rings"`: a row of share rings, each a toggle that scopes the list to its part. The web
 * half is a `<fieldset aria-label>`, which IS `role="group"`; RN spells that role the same, never
 * `accessible`, which would fold every ring into one target.
 */
export function ShareRings({ label, items, pressed, onPress }: ShareRingsProps) {
  const { number } = useFormat();
  const { ground } = useGround();
  const total = totalOf(items);
  return (
    <View role="group" accessibilityLabel={label} style={styles.row}>
      {items.map((item) => {
        const on = pressed === item.id;
        const hue = HUE_INK[item.hue];
        return (
          <Pressable
            key={item.id}
            accessibilityLabel={item.accessibleLabel}
            accessibilityState={{ selected: on }}
            onPress={() => onPress(item.id)}
            style={[
              styles.ring,
              on ? { backgroundColor: inkOver(hue, ground, RING_PRESSED_SHARE) } : undefined,
            ]}
          >
            <View style={styles.dial}>
              <ProgressRing geometry={SHARE_RING} share={arcShare(item.count, total)} ink={hue} />
              <View style={styles.dialCount} pointerEvents="none">
                <Text variant="body" bold style={styles.figure}>
                  {number(item.count)}
                </Text>
              </View>
            </View>
            <Text
              variant="caption"
              color="secondary"
              align="center"
              bold={item.asks === true}
              style={item.asks === true ? styles.warningWords : undefined}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing['sp-1'],
  },
  ring: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 6,
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-md'],
  },
  dial: {
    width: SHARE_RING.box,
    height: SHARE_RING.box,
  },
  dialCount: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figure: {
    fontVariant: ['tabular-nums'],
  },
  warningWords: {
    color: WARNING_WORDS,
  },
});
