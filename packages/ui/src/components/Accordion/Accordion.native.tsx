import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { renderMarks } from '../ChipGroup';
import { renderProvenance } from '../Provenance';
import { standingWordAt } from './Accordion.logic';
import type { AccordionItem, AccordionProps } from './Accordion.types';
import { markedState } from './Accordion.types';
import { useAccordion } from './useAccordion';

interface NativeAccordionProps extends AccordionProps {
  style?: StyleProp<ViewStyle>;
}

const type = theme.type.roles;

/** The panel's foot is the header's padding and this much more, as the web half draws it. */
const PANEL_FOOT = 6;

const styles = StyleSheet.create({
  /* A thin line above a section is all that parts it from the one before (`F7-49`). */
  parted: { borderTopWidth: 1, borderTopColor: theme.colors['line-soft'] },
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
  standing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    flexShrink: 1,
    minWidth: 0,
  },
  standingWord: {
    flexShrink: 1,
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: theme.colors['text-secondary'],
  },
  standingDot: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    flexShrink: 0,
  },
  state: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  stateWord: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    fontWeight: '500',
    color: theme.colors['danger-text'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
    backgroundColor: theme.colors.danger,
  },
  panel: { paddingTop: 4, gap: theme.spacing['sp-4'] },
  meta: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    flexShrink: 0,
    color: theme.colors['text-secondary'],
  },
  total: {
    fontFamily: theme.type.families.mono,
    fontSize: type['body-sm'].fontSize,
    fontWeight: '700',
    color: theme.colors['text-primary'],
    flexShrink: 0,
  },
  action: { flexShrink: 0 },
  beforeAction: { paddingRight: theme.spacing['sp-2'] },
});

function Chevron({ open, color }: { open: boolean; color: string }) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
    >
      <ShellGlyphMarks name="chevron" />
    </Svg>
  );
}

/** Where the section stands, beside its title: a word, and a dot before it for a marked state. */
function Standing({ item }: { item: AccordionItem }) {
  const word = standingWordAt(item, 'title');
  if (word === undefined) return null;
  const marked = markedState(item);
  const mark = marked === 'done' ? theme.colors.success : theme.colors['mark-subtle'];
  return (
    <View style={styles.standing}>
      {marked !== undefined ? (
        <View style={[styles.standingDot, { backgroundColor: mark }]} />
      ) : null}
      <Text style={styles.standingWord}>{word}</Text>
    </View>
  );
}

function HeaderFacts({ item }: { item: AccordionItem }) {
  const word = standingWordAt(item, 'end');
  return (
    <>
      {word !== undefined ? (
        <View style={styles.state}>
          <View style={styles.dot} />
          <Text style={styles.stateWord}>{word}</Text>
        </View>
      ) : null}
      {item.meta !== undefined ? <Text style={styles.meta}>{item.meta}</Text> : null}
      {item.total !== undefined && item.total !== null ? (
        <Text numberOfLines={1} style={styles.total}>
          {item.total}
        </Text>
      ) : null}
      {renderProvenance(item.provenance, { size: 12 })}
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
    <View style={style}>
      {items.map((item, index) => {
        const isOpen = openList.includes(item.key);
        return (
          /* A heading and its body on the page (`F7-49`): no fill, no ground of its own. An item
             in errors has no tint; its state word and dot carry the danger. */
          <View key={item.key} style={index > 0 ? styles.parted : undefined}>
            <View style={styles.head}>
              {/* The header's expanded state goes through the primitive — one declaration, the
                  web half's `aria-expanded` and this half's `accessibilityState.expanded` — so
                  the 44px floor and the pressed treatment come with it. */}
              <Pressable
                accessibilityState={{ expanded: isOpen }}
                onPress={() => toggle(item.key)}
                style={[
                  styles.toggle,
                  { paddingVertical: pad },
                  item.action !== undefined ? styles.beforeAction : undefined,
                ]}
              >
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{item.title}</Text>
                  {renderMarks(item.marks)}
                  <Standing item={item} />
                </View>
                <HeaderFacts item={item} />
                <Chevron open={isOpen} color={theme.colors['text-primary']} />
              </Pressable>
              {/* A sibling of the toggle, never inside it. */}
              {item.action !== undefined ? <View style={styles.action}>{item.action}</View> : null}
            </View>
            {isOpen ? (
              <View style={[styles.panel, { paddingBottom: pad + PANEL_FOOT }]}>
                {item.content}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
