import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { CategoryHue } from '../Avatar/Avatar.types';
import { HueTile } from '../HueTile/HueTile.native';
import type { HueTileTone } from '../HueTile/HueTile.types';
import type { FieldSave, StepFact, StepNotice } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { saveActOf, saveFaultOf } from './step-controls';

const TONE = {
  danger: { bg: colors['danger-bg'], fg: 'danger' },
  warning: { bg: colors['warning-bg'], fg: 'warning' },
  info: { bg: colors['info-bg'], fg: 'info' },
} as const;

/** One record of a step — its facts, its rows — as a tile on the page. */
export function StepTile({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[tileSurface, styles.tile, style]}>
      <GroundProvider ground="tile">{children}</GroundProvider>
    </View>
  );
}

/** A notice a step raises (`M06-30`, `T-M06-023`): what is so, what to do, and the act that does it. */
export function StepNote({
  notice,
  tone,
  glyph,
}: {
  notice: StepNotice;
  tone: 'danger' | 'warning' | 'info';
  glyph: ShellGlyphName;
}) {
  const ink = TONE[tone];
  const body = (
    <View style={[styles.note, { backgroundColor: ink.bg }]}>
      <ShellGlyph name={glyph} size="md" tone={ink.fg} />
      <View style={styles.grow}>
        <Text variant="body" color={ink.fg} bold>
          {notice.title}
        </Text>
        <Text variant="body-sm" color={ink.fg}>
          {notice.line}
        </Text>
      </View>
      {notice.act === undefined ? null : (
        <Text variant="body-sm" color={ink.fg} bold>
          {notice.act.label}
        </Text>
      )}
    </View>
  );
  return notice.act === undefined ? (
    <View accessibilityLiveRegion="polite">{body}</View>
  ) : (
    <Pressable style={styles.round} onPress={notice.act.onPress}>
      {body}
    </Pressable>
  );
}

/** A quiet line under a step's controls: who may change something, or where a change reaches. */
export function StepHint({
  glyph = 'info-circle',
  children,
}: {
  glyph?: ShellGlyphName;
  children: ReactNode;
}) {
  return (
    <View style={styles.hint}>
      <ShellGlyph name={glyph} size="sm" />
      <View style={styles.grow}>
        <Text variant="body-sm" color="secondary">
          {children}
        </Text>
      </View>
    </View>
  );
}

/** Read-only facts, one row each: a glyph, what it is, and its value as written. */
export function StepFacts({ facts }: { facts: readonly StepFact[] }) {
  return (
    <StepTile>
      {facts.map((fact, index) => (
        <View key={fact.key} style={[styles.fact, index > 0 ? styles.divided : undefined]}>
          <ShellGlyph name={fact.glyph} size="md" />
          <View style={styles.grow}>
            <Text variant="caption" color="secondary">
              {fact.label}
            </Text>
            <Text variant="body-sm" bold>
              {fact.value}
            </Text>
          </View>
        </View>
      ))}
    </StepTile>
  );
}

/** A worded act set in a step's own flow — *Add a step*, *Reset*. */
export function LinkAct({
  glyph,
  label,
  onPress,
  quiet = false,
}: {
  glyph: ShellGlyphName;
  label: TranslatedText;
  onPress: () => void;
  quiet?: boolean;
}) {
  return (
    <Pressable style={styles.link} onPress={onPress}>
      <ShellGlyph name={glyph} size="sm" tone={quiet ? 'secondary' : 'accent'} />
      <Text variant="body-sm" color={quiet ? 'secondary' : 'accent'} bold>
        {label}
      </Text>
    </Pressable>
  );
}

/** What a field's last commit came to, under the field it belongs to (`T-M06-023`). */
export function FieldSaveLine({
  save,
  words,
}: {
  save: FieldSave | undefined;
  words: ProposalStepWords;
}) {
  if (save === undefined) return null;
  if (save.kind === 'saved' || save.kind === 'saving') {
    return (
      <View style={styles.saved} accessibilityLiveRegion="polite">
        {save.kind === 'saved' ? <ShellGlyph name="tick-small" size="sm" tone="success" /> : null}
        <Text variant="caption" color="success">
          {save.kind === 'saved' ? (save.reason ?? words.saved) : words.saving}
        </Text>
      </View>
    );
  }
  const act = saveActOf(save);
  const line = (
    <View style={styles.fault}>
      <ShellGlyph name="alert-circle" size="sm" tone="warning" />
      <Text variant="caption" color="warning" bold>
        {saveFaultOf(save, words)}
      </Text>
    </View>
  );
  return act === undefined ? (
    <View accessibilityLiveRegion="polite">{line}</View>
  ) : (
    <Pressable style={styles.faultPress} onPress={act}>
      {line}
    </Pressable>
  );
}

/** One folded row's head and body; folded, the body is not drawn. */
export function FoldRow({
  glyph,
  hue,
  title,
  value,
  open,
  onToggle,
  aside,
  children,
  first = false,
}: {
  glyph: ShellGlyphName;
  hue: CategoryHue | HueTileTone;
  title: TranslatedText;
  value: TranslatedText;
  open?: boolean;
  onToggle?: () => void;
  aside?: ReactNode;
  children?: ReactNode;
  /** The first row of its tile draws no rule above it. */
  first?: boolean;
}) {
  const head = (
    <View style={styles.foldHead}>
      <HueTile glyph={glyph} hue={hue} size={36} stroke={1.7} />
      <View style={styles.grow}>
        <Text variant="body" bold>
          {title}
        </Text>
        <Text variant="body-sm" color="secondary">
          {value}
        </Text>
      </View>
      {onToggle === undefined ? (
        aside
      ) : (
        <ShellGlyph name={open === true ? 'chevron-up' : 'caret-down'} size="sm" />
      )}
    </View>
  );
  return (
    <View style={first ? undefined : styles.divided}>
      {onToggle === undefined ? (
        head
      ) : (
        <Pressable accessibilityState={{ expanded: open === true }} onPress={onToggle}>
          {head}
        </Pressable>
      )}
      {open === true ? (
        <Rising order={0}>
          <View style={styles.foldBody}>{children}</View>
        </Rising>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: theme.radius['r-lg'], overflow: 'hidden' },
  grow: { flex: 1, minWidth: 0 },
  round: { borderRadius: theme.radius['r-md'] },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
  },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  divided: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
  },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  fault: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius['r-xs'],
    backgroundColor: colors['warning-bg'],
  },
  faultPress: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  foldHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  foldBody: {
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    paddingBottom: theme.spacing['sp-4'],
  },
});

/** A step's column of parts, and a row of two fields. */
export const stepLayout = StyleSheet.create({
  column: { gap: theme.spacing['sp-5'] },
  hero: { gap: theme.spacing['sp-2'] },
  /* A save is out: the hero's figures are about to move, so they read as stale until the answer. */
  stale: { opacity: 0.55 },
  field: { gap: 6 },
  two: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  half: { flex: 1, minWidth: 0, gap: 6 },
  acts: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
