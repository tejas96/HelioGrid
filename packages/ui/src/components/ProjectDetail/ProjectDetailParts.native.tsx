import type { ProjectFile, TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { type ReactNode, type Ref, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { FileLink as NamedFileLink } from '../FileLink/FileLink.native';
import { HueTile } from '../HueTile/HueTile.native';
import { Switch } from '../Switch/Switch.native';
import type { ProjectBlock } from './ProjectDetail.blocks';
import type { DetailRow, DetailRowAct } from './ProjectDetail.rows';

/** A card's head on the phone, inside its tile: its name, a quiet note, its one act at the end. */
export function CardHead({
  title,
  aside,
  act = null,
  headingRef,
}: {
  title: TranslatedText;
  aside: TranslatedText | null;
  act?: ReactNode;
  /** Where focus lands when one of the card's acts leaves after its press. */
  headingRef?: Ref<View>;
}) {
  return (
    <View style={styles.head}>
      <View style={styles.headWords}>
        <View ref={headingRef} accessible accessibilityRole="header">
          <Text variant="h3">{title}</Text>
        </View>
        {aside === null ? null : (
          <Text variant="caption" color="secondary">
            {aside}
          </Text>
        )}
      </View>
      {act === null ? null : <View style={styles.headAct}>{act}</View>}
    </View>
  );
}

/** The files on a row, each its own name, opened with a tap. None draws nothing. */
export function FileLinks({
  files,
  onOpen,
}: {
  files: readonly ProjectFile[];
  onOpen: (file: ProjectFile) => void;
}) {
  if (files.length === 0) return null;
  return (
    <View style={styles.files}>
      {files.map((file) => (
        <NamedFileLink key={file.id} name={file.name} onOpen={() => onOpen(file)} />
      ))}
    </View>
  );
}

/** A file that did not reach the project, said where the person acted. */
export function NotSent({
  shown,
  words,
  onRetry,
}: {
  shown: boolean;
  words: TranslatedText;
  onRetry: (() => void) | null;
}) {
  if (!shown) return null;
  if (onRetry === null) {
    return (
      <Text variant="body-sm" color="danger" live>
        {words}
      </Text>
    );
  }
  return (
    <View style={styles.notSent}>
      <Button
        variant="ghost"
        size="sm"
        icon={<ShellGlyph name="alert" size="sm" tone="danger" />}
        onClick={onRetry}
      >
        {words}
      </Button>
    </View>
  );
}

/** One card of the project page on the phone: its head and act, its rows, and the way on. */
export function DetailCard({
  block,
  words,
  onOpenFile,
}: {
  block: ProjectBlock;
  words: { readonly notSent: TranslatedText };
  onOpenFile: (file: ProjectFile) => void;
}) {
  const { title, aside, act, rows, none, more } = block;
  const heading = useRef<View>(null);
  return (
    <Card density="functional" style={styles.card}>
      <CardHead
        title={title}
        aside={aside}
        act={act === null ? null : <RowAct act={act} focusAfter={heading} />}
        headingRef={heading}
      />
      <View style={styles.pad}>
        <NotSent shown={block.notSent} words={words.notSent} onRetry={act?.onPress ?? null} />
      </View>
      {rows.length === 0 ? (
        <View style={styles.none}>
          <Text variant="body-sm" color="secondary">
            {none}
          </Text>
        </View>
      ) : (
        rows.map((row, index) => (
          <Row
            key={row.key}
            first={index === 0}
            row={row}
            words={words}
            onOpenFile={onOpenFile}
            focus={heading}
          />
        ))
      )}
      {more === null ? null : (
        <View style={styles.more}>
          <RowAct act={more} focusAfter={heading} />
        </View>
      )}
    </Card>
  );
}

function Row({
  first,
  row,
  words,
  onOpenFile,
  focus,
}: {
  first: boolean;
  row: DetailRow;
  words: { readonly notSent: TranslatedText };
  onOpenFile: (file: ProjectFile) => void;
  focus: FocusAfter;
}) {
  const { name } = row;
  return (
    <View style={[styles.row, first ? undefined : styles.rule, row.busy ? styles.busy : undefined]}>
      <HueTile {...row.tile} />
      <View style={styles.main}>
        {typeof name === 'string' ? (
          <Text variant="body-sm" bold>
            {name}
          </Text>
        ) : (
          <NamedFileLink name={name.name} onOpen={() => onOpenFile(name)} />
        )}
        {row.sub === null ? null : (
          <Text variant="caption" color="secondary">
            {row.sub}
          </Text>
        )}
        <FileLinks files={row.files} onOpen={onOpenFile} />
        <NotSent shown={row.notSent} words={words.notSent} onRetry={row.acts[0]?.onPress ?? null} />
        {row.acts.slice(1).map((act) => (
          <View key={act.key} style={styles.under}>
            <RowAct act={act} focusAfter={focus} />
          </View>
        ))}
      </View>
      <RowEnd row={row} focus={focus} />
    </View>
  );
}

/** A row's end: its state, a quiet caption, its first act or its switch; a second act sits under. */
function RowEnd({ row, focus }: { row: DetailRow; focus: FocusAfter }) {
  const { mark, caption, show } = row;
  const acts = row.acts.slice(0, 1);
  if (mark === null && caption === null && acts.length === 0 && show === null) return null;
  return (
    <View style={styles.end}>
      {mark === null ? null : <StatusMark tone={mark.tone} label={mark.label} />}
      {caption === null ? null : (
        <Text variant="caption" color="secondary">
          {caption}
        </Text>
      )}
      {acts.map((act) => (
        <RowAct key={act.key} act={act} focusAfter={focus} />
      ))}
      {show === null ? null : <Switch {...show} />}
    </View>
  );
}

/**
 * One act on a card or a row, spoken with its row. One that leaves after its press lands the
 * screen reader on the card's heading, so it is never lost.
 */
export function RowAct({ act, focusAfter }: { act: DetailRowAct; focusAfter: FocusAfter }) {
  const leaving = useFocusAfter(focusAfter);
  const { label, spoken, variant, glyph, loading, onPress } = act;
  const icon = glyph === null ? null : <ShellGlyph name={glyph} size="sm" tone="primary" />;
  return (
    <Button
      variant={variant}
      size="sm"
      icon={icon}
      loading={loading}
      {...(spoken === null ? {} : { spokenName: spoken })}
      onClick={leaving(onPress)}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  notSent: { alignItems: 'flex-start' },
  card: { padding: theme.spacing['sp-1'], gap: theme.spacing['sp-1'] },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingTop: theme.spacing['sp-3'],
    paddingBottom: theme.spacing['sp-1'],
  },
  headWords: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
  },
  headAct: { flexShrink: 0 },
  pad: { paddingHorizontal: theme.spacing['sp-3'] },
  none: { paddingHorizontal: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-3'] },
  more: { flexDirection: 'row', paddingHorizontal: theme.spacing['sp-1'] },
  files: { alignSelf: 'stretch', gap: theme.spacing['sp-0-5'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: theme.spacing['sp-16'],
    padding: theme.spacing['sp-3'],
  },
  rule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors['line-soft'] },
  busy: { opacity: 0.6 },
  main: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  under: { flexDirection: 'row' },
  /* The mark over the act, never beside it: side by side they took half the row, and a Hindi
     row's name wrapped to three lines in what was left. */
  end: {
    flexShrink: 0,
    maxWidth: '45%',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: theme.spacing['sp-1'],
  },
});
