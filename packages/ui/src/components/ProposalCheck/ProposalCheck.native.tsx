import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { labelRunsOf } from '../Button/Button.logic';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { HueTile } from '../HueTile/HueTile.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail.native';
import { Textarea } from '../Textarea/Textarea.native';
import { type CheckFound, checkActOf, checkFoundOf } from './ProposalCheck.logic';
import type {
  CheckFinding,
  CheckSummary,
  ProposalCheckSheetProps,
  ProposalCheckWords,
} from './ProposalCheck.types';

// web-only part: ProposalBuilder — the web takes only riseOrder for its CSS stagger; the phone uses Rising.

function Findings({
  findings,
  tone,
  from,
}: {
  findings: readonly CheckFinding[];
  tone: 'danger' | 'warning';
  from: number;
}) {
  return (
    <View style={styles.finds}>
      {findings.map((finding, index) => (
        <Rising key={finding.key} order={from + index}>
          <Pressable style={[tileSurface, styles.find]} onPress={finding.onFix}>
            <GroundProvider ground="tile">
              <HueTile
                glyph={tone === 'danger' ? 'alert-circle' : 'alert-triangle'}
                hue={tone}
                size={40}
              />
              <View style={styles.words}>
                <Text variant="body" bold>
                  {finding.title}
                </Text>
                <Text variant="body-sm" color="secondary">
                  {finding.line}
                </Text>
              </View>
              <ShellGlyph name="chevron-right" size="sm" />
            </GroundProvider>
          </Pressable>
        </Rising>
      ))}
    </View>
  );
}

function Summary({ summary }: { summary: CheckSummary }) {
  return (
    <View style={styles.summary}>
      <View style={styles.thumb}>{summary.cover}</View>
      <View style={styles.words}>
        <Text variant="display" style={styles.name}>
          {summary.name}
        </Text>
        <Text variant="body-sm" color="secondary">
          {labelRunsOf(summary.line, [summary.amount]).map((run) =>
            run.mono ? (
              <Text key={run.text} variant="mono" color="secondary">
                {run.text}
              </Text>
            ) : (
              run.text
            ),
          )}
        </Text>
        <Text variant="body-sm" color="secondary">
          {summary.facts}
        </Text>
      </View>
    </View>
  );
}

function Limit({ words }: { words: ProposalCheckWords }) {
  const { limit } = words;
  return (
    <>
      <View style={styles.used}>
        <HueTile glyph="gauge" hue="warning" size={40} />
        <View style={styles.words}>
          <Text variant="body" color="warning" bold>
            {limit.used}
          </Text>
          <Text variant="body-sm" color="warning">
            {limit.resets}
          </Text>
        </View>
      </View>
      <View style={[tileSurface, styles.works]}>
        <GroundProvider ground="tile">
          {limit.works.map((work, index) => (
            <View key={work} style={[styles.work, index > 0 ? styles.divided : undefined]}>
              <Badge tone="success" glyph="check">
                {limit.stillWorks}
              </Badge>
              <View style={styles.words}>
                <Text variant="body" bold>
                  {work}
                </Text>
              </View>
            </View>
          ))}
        </GroundProvider>
      </View>
      <View style={styles.hint}>
        <ShellGlyph name="info" size="sm" />
        <View style={styles.words}>
          <Text variant="body-sm" color="secondary">
            {limit.who}
          </Text>
        </View>
      </View>
    </>
  );
}

function Found({ found }: { found: CheckFound }) {
  const { summary, changeNote, groups, hint } = found;
  return (
    <>
      {summary === null ? null : <Summary summary={summary} />}
      {changeNote === null ? null : (
        <Textarea
          label={changeNote.label}
          helper={changeNote.hint}
          value={changeNote.value}
          onChange={changeNote.onChange}
          rows={3}
          maxLength={changeNote.maxLength}
          {...(changeNote.error === undefined ? {} : { error: changeNote.error })}
        />
      )}
      {groups.map((group) => (
        <Fragment key={group.tone}>
          {group.over === undefined ? null : (
            <Text variant="overline" color="secondary">
              {group.over}
            </Text>
          )}
          <Findings findings={group.findings} tone={group.tone} from={group.from} />
        </Fragment>
      ))}
      {hint === undefined ? null : (
        <View style={styles.hint}>
          <ShellGlyph name="info" size="sm" />
          <View style={styles.words}>
            <Text variant="body-sm" color="secondary">
              {hint}
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

/** The check before Generate: what stops it, what to look at, or what is about to be made. */
export function ProposalCheckSheet({ open, onClose, words, state }: ProposalCheckSheetProps) {
  const generating = state.kind === 'clear' && state.generating;
  const act = checkActOf(state, words, onClose);
  const found = checkFoundOf(state, words);
  return (
    <EditorSurface
      open={open}
      onClose={() => {
        if (!generating) onClose();
      }}
      closeLabel={words.closeLabel}
      desktop="modal"
      showClose
      dismissible={!generating}
      title={words.title}
      footer={
        <View style={styles.foot}>
          {generating ? (
            <View
              accessible
              accessibilityLabel={words.generating}
              accessibilityState={{ busy: true }}
              accessibilityLiveRegion="polite"
            >
              <IndeterminateRail width="100%" thickness={3} />
            </View>
          ) : null}
          {state.kind === 'clear' && state.failure !== undefined ? (
            <Text variant="body-sm" color="danger" live>
              {state.failure}
            </Text>
          ) : null}
          {act === null ? null : (
            <Button
              {...act.button}
              {...(act.forward
                ? { iconRight: <ShellGlyph name="arrow-right" size="sm" tone="inverse" /> }
                : {})}
            >
              {act.label}
            </Button>
          )}
          <Text variant="caption" color="secondary" align="center">
            {words.note}
          </Text>
        </View>
      }
    >
      <View style={styles.body}>
        {state.kind === 'checking' ? (
          <LoadingBars label={words.checking} bars={['row', 'row', 'row']} />
        ) : null}
        {state.kind === 'limit' ? <Limit words={words} /> : null}
        {found === null ? null : <Found found={found} />}
      </View>
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.spacing['sp-4'] },
  finds: { gap: theme.spacing['sp-2'] },
  foot: { gap: theme.spacing['sp-2'] },
  find: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingLeft: theme.spacing['sp-3'],
    paddingRight: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
  },
  words: { flex: 1, minWidth: 0 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    backgroundColor: colors['canvas-sunken'],
  },
  thumb: { transform: [{ rotate: '-3deg' }] },
  // The name in the display face at the web's `.hg-pchk-name` size.
  name: { fontSize: theme.type.roles.h2.fontSize, lineHeight: 28 },
  used: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: TONE.warning.tint,
  },
  works: { borderRadius: theme.radius['r-lg'], overflow: 'hidden' },
  work: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    minHeight: 56,
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  divided: { borderTopWidth: 1, borderTopColor: colors['line-soft'] },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
});
