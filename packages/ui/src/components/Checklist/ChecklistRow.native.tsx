import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { renderActorClass } from '../ActorClass/ActorClass.native';
import { renderPending } from '../PendingAction/PendingAction.native';
import type { ChecklistItem, ChecklistProps } from './Checklist.types';

/* Off-scale design-system measurements: the box, its radius, and the row's own rhythm. */
const BOX = 22;
const BOX_RADIUS = 7;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.spacing['sp-1'], alignItems: 'flex-start' },
  rowDocument: {
    flexDirection: 'row',
    gap: theme.spacing['sp-3'],
    alignItems: 'flex-start',
    paddingVertical: theme.spacing['sp-3'],
  },
  /* The 44dp floor and the centring belong to the Pressable primitive; only the row-level fact
     that this column never shrinks is this component's to say. */
  toggle: { flexShrink: 0 },
  rowBody: { flex: 1, minWidth: 0, paddingVertical: 11 },
  box: {
    width: BOX,
    height: BOX,
    borderRadius: BOX_RADIUS,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  /* RN has no inset shadow, so the resting box's `inset 0 0 0 1.5px --mark-subtle` ring is a
     real border of the same weight and colour. The outer e1 shadow rides on top unchanged. */
  boxResting: { borderWidth: 1.5, borderColor: theme.colors['mark-subtle'], ...theme.elevation.e1 },
  boxDone: { backgroundColor: theme.colors.success },
  boxWaiting: { opacity: 0.55 },
  body: { flex: 1, minWidth: 0, flexDirection: 'column', gap: 5 },
  titleRow: { flexDirection: 'row', gap: theme.spacing['sp-2'], alignItems: 'baseline' },
  evidence: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  attribution: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});

function TickBox({
  done,
  waiting,
  printable,
}: {
  done: boolean;
  waiting?: boolean;
  printable?: boolean;
}) {
  const filled = done && printable !== true;
  return (
    <View
      style={[
        styles.box,
        filled ? styles.boxDone : styles.boxResting,
        waiting === true ? styles.boxWaiting : null,
      ]}
    >
      {filled ? (
        <Svg width={13} height={13} viewBox="0 0 12 12" fill="none">
          <Path
            d="M2.5 6.5 5 9l4.5-5"
            stroke={theme.colors['text-inverse']}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

function Body({ item, number }: { item: ChecklistItem; number: string | number }) {
  /* Attribution is ActorClass's job — the same four classes the stream and the task list use.
     Only a DONE item has anyone to name. */
  const attribution =
    item.done === true ? renderActorClass(item.doneBy, { form: 'stream', size: 12 }) : null;
  return (
    <View style={styles.body}>
      <View style={styles.titleRow}>
        <Text variant="mono" color="tertiary" style={{ fontWeight: '700' }}>
          {String(number)}
        </Text>
        <Text variant="body" style={{ fontWeight: '600', letterSpacing: -0.15 }}>
          {item.title}
        </Text>
      </View>
      {item.detail === undefined ? null : (
        <Text variant="body-sm" color="secondary">
          {item.detail}
        </Text>
      )}
      {item.materials !== undefined && item.materials.length > 0 ? (
        <Text variant="caption" color="tertiary">
          <Text variant="caption" color="tertiary" style={{ fontWeight: '600' }}>
            Materials{' '}
          </Text>
          {item.materials.join(' · ')}
        </Text>
      ) : null}
      {/* MS10-10's proof. `href` cannot be followed from inside the design system — opening a URL
          is the host's act, not a component's — so the touch form fires `onOpen` and the caller
          decides where it goes. */}
      {item.evidence === undefined ? null : (
        <Pressable onPress={item.evidence.onOpen} style={styles.evidence}>
          <Text variant="body-sm" color="accent" style={{ fontWeight: '500' }}>
            {item.evidence.label ?? 'See the evidence'}
          </Text>
          <Icon size="sm" color={theme.colors.accent}>
            <Svg viewBox="0 0 24 24" fill="none">
              <Path
                d="M7 17 17 7M17 7h-7m7 0v7"
                stroke={theme.colors.accent}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Icon>
        </Pressable>
      )}
      {attribution !== null || item.doneAt !== undefined ? (
        <View style={styles.attribution}>
          {attribution}
          {attribution !== null && item.doneAt !== undefined ? (
            <Text variant="caption" color="tertiary">
              ·
            </Text>
          ) : null}
          {item.doneAt}
        </View>
      ) : null}
      {/* The write in flight — PendingAction's line, never an optimistic flip of the box. */}
      {renderPending(item.pending, { size: 12 })}
    </View>
  );
}

/**
 * One step. **A tick is a server write, not a checkbox flip** — the box holds its previous state,
 * `item.pending` names the act, the row stays operable, and only confirmed data flips it (`F8-36`).
 */
export function ChecklistRow({
  item,
  number,
  onToggle,
  surface,
}: {
  item: ChecklistItem;
  number: string | number;
  onToggle: ChecklistProps['onToggle'];
  surface: NonNullable<ChecklistProps['surface']>;
}) {
  const done = item.done === true;
  const waiting = Boolean(item.pending);

  if (surface === 'document') {
    return (
      <View role="listitem" style={styles.rowDocument}>
        <TickBox done={done} printable />
        <Body item={item} number={number} />
      </View>
    );
  }

  return (
    /* The web half's row is an `<li>` in the group's `<ul>`, so the native row is a `listitem`. */
    <View role="listitem" style={styles.row}>
      {/* The primitive carries the role AND the checked state, so this control says what it is
          without dropping to RN's own Pressable — and the 44dp floor comes with it. */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, busy: waiting }}
        accessibilityLabel={`${typeof item.title === 'string' ? item.title : ''}${done ? ', done' : ', not done'}`}
        onPress={() => onToggle?.(item, !done)}
        style={styles.toggle}
      >
        <TickBox done={done} waiting={waiting} />
      </Pressable>
      <View style={styles.rowBody}>
        <Body item={item} number={number} />
      </View>
    </View>
  );
}
