import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import type { MarketFormat } from '../../utils/format';
import { ActorClass } from '../ActorClass';
import { renderMarks } from '../ChipGroup';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import { ActivityGlyph } from './ActivityGlyph.native';
import { asDate, hhmm, isValidDate, kindOf } from './ActivityStream.kinds';
import type { ActivityEntry, ActivityKindSpec, ActivityTone } from './ActivityStream.types';

const type = theme.type.roles;

/** Both channels are certified pairs: the mark takes the tone's -bg, the glyph the tone's -text. */
const TONES: Record<ActivityTone, { bg: string; fg: string }> = {
  neutral: { bg: theme.colors['neutral-bg'], fg: theme.colors['neutral-text'] },
  accent: { bg: theme.colors['accent-subtle'], fg: theme.colors.accent },
  success: { bg: theme.colors['success-bg'], fg: theme.colors['success-text'] },
  warning: { bg: theme.colors['warning-bg'], fg: theme.colors['warning-text'] },
  danger: { bg: theme.colors['danger-bg'], fg: theme.colors['danger-text'] },
  info: { bg: theme.colors['info-bg'], fg: theme.colors['info-text'] },
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', columnGap: theme.spacing['sp-3'], alignItems: 'flex-start' },
  mark: { alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  body: { flex: 1, minWidth: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  kind: {
    fontFamily: theme.type.families.sans,
    fontSize: type.caption.fontSize,
    fontWeight: '500',
    color: theme.colors['text-tertiary'],
  },
  time: {
    fontFamily: theme.type.families.mono,
    fontSize: type.caption.fontSize,
    color: theme.colors['text-tertiary'],
  },
  summaryRow: { marginTop: 2 },
  summary: { fontFamily: theme.type.families.sans, color: theme.colors['text-primary'] },
  /* Pressable centres its children; a summary is a full-width line of text. */
  summaryTarget: { alignItems: 'flex-start', justifyContent: 'center', width: '100%' },
  detail: {
    marginTop: 4,
    fontFamily: theme.type.families.sans,
    fontSize: type['body-sm'].fontSize,
    lineHeight: 20.2,
    color: theme.colors['text-secondary'],
  },
  actor: { marginTop: 6 },
  marks: { marginTop: theme.spacing['sp-2'] },
  tier: { marginTop: 6 },
  content: { marginTop: 10 },
  action: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    alignItems: 'center',
    minHeight: 44,
  },
});

export interface StreamEntryProps {
  entry: ActivityEntry;
  kinds: Record<string, ActivityKindSpec>;
  density: 'expressive' | 'functional';
  format: MarketFormat;
}

/** One entry: the kind's mark, the kind's word, the clock, the summary and the actor class. */
export function StreamEntry({ entry, kinds, density, format }: StreamEntryProps) {
  const spec = kindOf(kinds, entry.kind);
  const tone = TONES[spec.tone];
  const date = asDate(entry.at);
  const circle = density === 'functional' ? 32 : 36;
  const summaryType = { fontSize: density === 'functional' ? 14 : type.body.fontSize };
  const summary: ReactNode =
    entry.onOpen !== undefined ? (
      <Pressable onPress={entry.onOpen} style={styles.summaryTarget}>
        <Text style={[styles.summary, summaryType]}>{entry.summary}</Text>
      </Pressable>
    ) : (
      <Text style={[styles.summary, summaryType]}>{entry.summary}</Text>
    );
  return (
    <View style={[styles.row, { paddingBottom: density === 'functional' ? 14 : 18 }]}>
      <View
        style={[
          styles.mark,
          { width: circle, height: circle, borderRadius: circle / 2, backgroundColor: tone.bg },
        ]}
      >
        <ActivityGlyph
          name={spec.glyph}
          size={density === 'functional' ? 15 : 17}
          color={tone.fg}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.head}>
          {/* The kind is a word on the entry, not a colour on the mark. */}
          <Text style={styles.kind}>{spec.label}</Text>
          {isValidDate(date) ? <Text style={styles.time}>{format.time(hhmm(date))}</Text> : null}
        </View>
        <View style={styles.summaryRow}>{summary}</View>
        {entry.detail !== undefined ? <Text style={styles.detail}>{entry.detail}</Text> : null}
        {/* THE ACTOR CLASS, always in words — one vocabulary, shared with a task's `origin`. */}
        <View style={styles.actor}>
          <ActorClass actorClass={entry.actorClass} actor={entry.actor} size={12} />
        </View>
        {entry.marks !== undefined ? (
          <View style={styles.marks}>{renderMarks(entry.marks)}</View>
        ) : null}
        {entry.provenance !== undefined ? (
          <View style={styles.tier}>
            {renderProvenance(entry.provenance as ProvenanceProps | ReactNode, { size: 12 })}
          </View>
        ) : null}
        {entry.content !== undefined ? <View style={styles.content}>{entry.content}</View> : null}
        {entry.action !== undefined ? <View style={styles.action}>{entry.action}</View> : null}
      </View>
    </View>
  );
}
