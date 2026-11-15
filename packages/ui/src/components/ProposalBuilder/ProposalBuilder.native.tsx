import { theme } from '@heliogrid/theme';
import { useImperativeHandle, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { KeyboardFrame } from '../../primitives/Keyboard/KeyboardFrame.native';
import { closeKeyboard } from '../../primitives/Keyboard/use-keyboard.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import { useChosenInView } from '../../primitives/use-chosen-in-view.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { IconButton } from '../IconButton/IconButton.native';
import { BuilderSaveMark } from './BuilderSaveMark.native';
import { builderPlace, trackAt } from './ProposalBuilder.logic';
import type { ProposalBuilderProps } from './ProposalBuilder.types';

/**
 * A press that leaves the field in use: on touch it never blurs the field first, so the field is let
 * go here, before the move, and commits what was typed (`packages/ui/CLAUDE.md` Traps).
 */
function leavingField(press: () => void): () => void {
  return () => {
    closeKeyboard();
    press();
  };
}

/** A settings page's parts as one scrolling row (`T-M01-030`): the one in view is the accent wash. */
function PartTabs({ props, at }: { props: ProposalBuilderProps; at: number }) {
  const { strip, placed } = useChosenInView(at);
  return (
    <ScrollView
      ref={strip}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabs}
      contentContainerStyle={styles.tabsRow}
      accessibilityRole="tablist"
      accessibilityLabel={props.words.steps}
    >
      {props.steps.map((item, index) => {
        const now = index === at;
        return (
          <View key={item.key} onLayout={placed(index)}>
            <Pressable
              style={[styles.tab, now ? styles.tabNow : undefined]}
              accessibilityRole="tab"
              accessibilityState={{ selected: now }}
              onPress={leavingField(() => props.onStep(item.key))}
            >
              <ShellGlyph name={item.glyph} size="sm" tone={now ? 'accent' : 'primary'} />
              <Text variant="body-sm" color={now ? 'accent' : 'primary'} bold={now}>
                {item.title}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

/**
 * The builder's frame on the phone (`T-M06-002`): icon bar, track, the large title with the save
 * state, the step, and the dock — which stays whole above the keyboard while a field is in use.
 * The phone app has one form: `wide` and the stage are the web's, and are not drawn here.
 */
export function ProposalBuilder(props: ProposalBuilderProps) {
  const { words, steps, current, safe, parts } = props;
  const place = builderPlace(steps, current);
  const { step, next, previous } = place;
  const heading = useRef<View>(null);
  useImperativeHandle(props.titleRef, () => ({
    focus: () => focusScreenReaderOn(() => heading.current),
  }));
  if (step === undefined) return null;
  const at = place.index + 1;
  const bottom = safe?.bottom ?? 0;
  const forward = leavingField(
    place.last ? props.onGenerate : () => next && props.onStep(next.key),
  );
  const dock = (
    <View style={[styles.dockWrap, { paddingBottom: bottom + theme.spacing['sp-3'] }]}>
      <View style={styles.dock}>
        <IconButton
          size={52}
          variant="ghost"
          style={styles.back}
          label={words.back}
          disabled={place.first}
          onClick={leavingField(() => previous && props.onStep(previous.key))}
        >
          <ShellGlyph name="chevron-left" size="md" tone="primary" />
        </IconButton>
        <Pressable style={styles.next} onPress={forward}>
          <Text variant="body" color="inverse" bold oneLine>
            {next === undefined ? words.last : words.next(next.title)}
          </Text>
          <ShellGlyph
            name={place.last ? (parts === undefined ? 'file-text' : 'tick') : 'arrow-right'}
            size="md"
            tone="inverse"
          />
        </Pressable>
      </View>
    </View>
  );
  return (
    <View style={styles.frame}>
      <View style={[styles.top, { paddingTop: (safe?.top ?? 0) + theme.spacing['sp-3'] }]}>
        <IconButton size={44} label={words.close} onClick={leavingField(props.onClose)}>
          <ShellGlyph
            name={parts === undefined ? 'close' : 'chevron-left'}
            size="sm"
            tone="primary"
          />
        </IconButton>
        {parts === undefined ? (
          <Pressable
            style={styles.capsule}
            accessibilityLabel={words.openSteps(at, place.total, step.title)}
            onPress={leavingField(props.onOpenSteps)}
          >
            <Text variant="mono" color="accent">
              {words.count(at, place.total)}
            </Text>
            <View style={styles.capsuleTitle}>
              <Text variant="body-sm" bold oneLine>
                {step.title}
              </Text>
            </View>
            <ShellGlyph name="chevrons-up-down" size="sm" />
          </Pressable>
        ) : (
          <View style={[styles.capsule, styles.capsuleStill]}>
            <Text variant="body-sm" bold oneLine>
              {props.title}
            </Text>
          </View>
        )}
        {props.onPreview === undefined ? (
          <View style={styles.gap} />
        ) : (
          <IconButton size={44} label={words.preview} onClick={leavingField(props.onPreview)}>
            <ShellGlyph name="eye" size="sm" tone="primary" />
          </IconButton>
        )}
      </View>
      {parts === undefined ? (
        <View style={styles.track} importantForAccessibility="no-hide-descendants">
          {steps.map((item, index) => {
            const where = trackAt(index, place.index);
            const todo = item.standing === 'to_do' && where !== 'now';
            return (
              <View
                key={item.key}
                style={[
                  styles.part,
                  where === 'done' ? styles.partDone : undefined,
                  where === 'now' ? styles.partNow : undefined,
                  todo ? styles.partTodo : undefined,
                ]}
              />
            );
          })}
        </View>
      ) : (
        <PartTabs props={props} at={place.index} />
      )}
      <KeyboardFrame
        foot={dock}
        footBandUnderKeyboard={bottom}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.title}>
          <View ref={heading} accessible accessibilityRole="header">
            <Text variant="display">{step.heading}</Text>
          </View>
          <View style={styles.under}>
            <Text variant="body-sm" color="secondary">
              {props.customerLine}
            </Text>
            <BuilderSaveMark save={props.save} words={words} />
          </View>
        </View>
        {props.children}
      </KeyboardFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  gap: { width: 44 },
  capsule: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    height: 44,
    paddingLeft: theme.spacing['sp-4'],
    paddingRight: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    // biome-ignore lint/plugin/raw-white: a control set straight on the page is the card colour (Ground)
    backgroundColor: colors.surface,
  },
  capsuleTitle: { flexShrink: 1, minWidth: 0 },
  capsuleStill: { paddingHorizontal: theme.spacing['sp-5'] },
  tabs: { flexGrow: 0, paddingTop: theme.spacing['sp-3'] },
  tabsRow: { gap: theme.spacing['sp-2'], paddingHorizontal: theme.spacing['sp-5'] },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    // biome-ignore lint/plugin/raw-white: a control set straight on the page is the card colour (Ground)
    backgroundColor: colors.surface,
  },
  tabNow: { borderColor: colors.accent, backgroundColor: colors['accent-subtle'] },
  track: {
    flexDirection: 'row',
    gap: theme.spacing['sp-1'],
    paddingTop: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-5'],
  },
  part: { flex: 1, height: 4, borderRadius: 4, backgroundColor: colors['line-strong'] },
  partDone: { backgroundColor: colors['text-primary'] },
  partNow: { flex: 2.2, backgroundColor: colors.accent },
  partTodo: { backgroundColor: colors.warning },
  scroll: { gap: theme.spacing['sp-5'], padding: theme.spacing['sp-5'] },
  title: { gap: theme.spacing['sp-1'] },
  under: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  dockWrap: { paddingHorizontal: theme.spacing['sp-4'], paddingTop: theme.spacing['sp-2'] },
  dock: {
    flexDirection: 'row',
    gap: theme.spacing['sp-2'],
    padding: 6,
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    // biome-ignore lint/plugin/raw-white: the floating dock is the card colour over the page, as the shell's pill is
    backgroundColor: colors.surface,
    /* It floats as the shell's pill does: the phone draws no blur, so the lift is its shadow. */
    ...theme.elevation.e4,
  },
  // The back disc is the dock's well, as the web's `.hg-pbf-dock-back`.
  back: { backgroundColor: colors.fill },
  next: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    height: 52,
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['action-primary'],
  },
});
