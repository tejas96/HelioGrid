import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { renderMarks } from '../ChipGroup';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import type { AccordionItem, AccordionItemState, AccordionProps } from './Accordion.types';
import { accordionStateWord, markedState } from './Accordion.types';
import { useAccordion } from './useAccordion';

interface NativeAccordionProps extends AccordionProps {
  style?: StyleProp<ViewStyle>;
}

const type = theme.type.roles;

/** The state's word colour and its dot. The dot is the second, non-colour channel. */
const STATE_INK: Record<Exclude<AccordionItemState, 'default'>, { fg: string; mark: string }> = {
  errors: { fg: theme.colors['danger-text'], mark: theme.colors.danger },
  done: { fg: theme.colors['success-text'], mark: theme.colors.success },
  empty: { fg: theme.colors['text-tertiary'], mark: theme.colors.neutral },
};

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-2'] },
  item: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    overflow: 'hidden',
    ...theme.elevation.e1,
  },
  itemFunctional: { borderRadius: theme.radius['r-card-functional'] },
  /* A tinted section is a THIRD background: text-tertiary measures 4.48 on danger-bg, under the
     floor, so every quiet line on a tinted section steps up to text-secondary. */
  itemErrors: { backgroundColor: theme.colors['danger-bg'] },
  head: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  toggle: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  title: {
    fontFamily: theme.type.families.sans,
    fontSize: type.body.fontSize,
    fontWeight: '700',
    letterSpacing: -0.15,
    color: theme.colors['text-primary'],
  },
  state: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  stateWord: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    fontWeight: '500',
  },
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  meta: { fontFamily: theme.type.families.sans, fontSize: type.caption.fontSize, flexShrink: 0 },
  total: {
    fontFamily: theme.type.families.mono,
    fontSize: type['body-sm'].fontSize,
    fontWeight: '700',
    color: theme.colors['text-primary'],
    flexShrink: 0,
  },
  action: { flexShrink: 0 },
});

function Chevron({ open, color }: { open: boolean; color: string }) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
    >
      <Path d="m6 9 6 6 6-6" stroke={color} />
    </Svg>
  );
}

function HeaderFacts({ item, quiet }: { item: AccordionItem; quiet: string }) {
  const word = accordionStateWord(item);
  const marked = markedState(item);
  const ink = marked !== undefined ? STATE_INK[marked] : undefined;
  const wordStyle: StyleProp<TextStyle> = [styles.stateWord, { color: ink?.fg ?? quiet }];
  return (
    <>
      {word !== undefined ? (
        <View style={styles.state}>
          {ink !== undefined ? <View style={[styles.dot, { backgroundColor: ink.mark }]} /> : null}
          <Text style={wordStyle}>{word}</Text>
        </View>
      ) : null}
      {item.meta !== undefined ? (
        <Text style={[styles.meta, { color: quiet }]}>{item.meta}</Text>
      ) : null}
      {item.total !== undefined && item.total !== null ? (
        <Text numberOfLines={1} style={styles.total}>
          {item.total}
        </Text>
      ) : null}
      {renderProvenance(item.provenance as ProvenanceProps | ReactNode, { size: 12 })}
    </>
  );
}

/**
 * Collapsible sections for long forms and settings. The web half moves between headers with
 * Up/Down/Home/End; on touch there is no roving focus, so a header is reached by tapping it and
 * the toggle announces its expanded state instead.
 */
export function Accordion({
  items,
  value,
  onChange,
  multiple = false,
  defaultOpen = [],
  openWithErrors = true,
  density = 'expressive',
  style,
}: NativeAccordionProps) {
  const { openList, toggle } = useAccordion({
    items,
    value,
    onChange,
    multiple,
    defaultOpen,
    openWithErrors,
  });
  const pad = density === 'functional' ? 14 : 18;

  return (
    <View style={[styles.list, style]}>
      {items.map((item) => {
        const isOpen = openList.includes(item.key);
        const errored = item.state === 'errors';
        // A state word is primary information (`N4`), never the quiet role — see the web half.
        const quiet = theme.colors['text-secondary'];
        return (
          <View
            key={item.key}
            style={[
              styles.item,
              density === 'functional' ? styles.itemFunctional : null,
              errored ? styles.itemErrors : null,
            ]}
          >
            <View style={styles.head}>
              {/* The header's expanded state goes through the primitive — one declaration, the
                  web half's `aria-expanded` and this half's `accessibilityState.expanded` — so
                  the 44px floor and the pressed treatment come with it. */}
              <Pressable
                accessibilityState={{ expanded: isOpen }}
                onPress={() => toggle(item.key)}
                style={[
                  styles.toggle,
                  { padding: pad, paddingRight: item.action !== undefined ? 8 : pad },
                ]}
              >
                <Chevron open={isOpen} color={quiet} />
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{item.title}</Text>
                  {renderMarks(item.marks)}
                </View>
                <HeaderFacts item={item} quiet={quiet} />
              </Pressable>
              {/* A sibling of the toggle, never inside it. */}
              {item.action !== undefined ? (
                <View style={[styles.action, { paddingRight: pad }]}>{item.action}</View>
              ) : null}
            </View>
            {isOpen ? (
              <View style={{ paddingHorizontal: pad, paddingBottom: pad }}>{item.content}</View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
