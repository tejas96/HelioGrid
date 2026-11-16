import type { ProposalDetail } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { failedReadOf } from '../ProposalAfterParts/ProposalAfterParts.logic';
import { AfterRow, AfterRows } from '../ProposalAfterParts/ProposalAfterParts.native';
import { ProposalStatus } from '../ProposalStatus/ProposalStatus.native';
import {
  TRACK_ACT_GLYPH,
  TRACK_WAIT_BARS,
  trackActsOf,
  trackNodeState,
  trackReached,
  trackRowViewsOf,
} from './ProposalTrack.logic';
import type { ProposalTrackProps, TrackAct } from './ProposalTrack.types';

type Ready = ProposalTrackProps & { readonly detail: ProposalDetail };

function Acts({ detail, words, pending, failure, onAct }: Ready) {
  const acts = trackActsOf(detail);
  if (acts.main === null) return null;
  const button = (act: TrackAct, variant: 'primary' | 'secondary') => (
    <Button
      variant={variant}
      size="lg"
      icon={
        <ShellGlyph
          name={TRACK_ACT_GLYPH[act]}
          size="md"
          tone={variant === 'primary' ? 'inverse' : 'primary'}
        />
      }
      loading={pending === act}
      disabled={pending !== null && pending !== act}
      onClick={() => onAct(act)}
    >
      {words.act(act, detail)}
    </Button>
  );
  return (
    <View style={styles.acts}>
      {button(acts.main, 'primary')}
      {acts.second === null ? null : button(acts.second, 'secondary')}
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
    </View>
  );
}

function Steps({ detail, words }: Ready) {
  const reached = trackReached(detail.tracking);
  const { ground } = useGround();
  return (
    <View style={styles.steps} accessibilityLabel={words.trackName} role="list" collapsable={false}>
      {words.nodes(detail.tracking).map((node, index) => {
        const at = trackNodeState(index, reached);
        const lit = at !== 'ahead';
        return (
          <View key={node.name} style={styles.step} accessible>
            <View style={[styles.rail, at === 'done' ? styles.railDone : undefined]} />
            {at === 'now' ? <View style={styles.halo} /> : null}
            <View style={[styles.dot, lit ? styles.dotLit : { backgroundColor: ground }]}>
              {lit ? <ShellGlyph name="check" size="sm" tone="inverse" /> : null}
            </View>
            <Text variant="body-sm" bold={lit} color={lit ? 'primary' : 'secondary'}>
              {node.name}
            </Text>
            <Text variant="caption" color="secondary">
              {node.when}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Rows(props: Ready) {
  return (
    <AfterRows>
      {trackRowViewsOf(props, props.detail).map((each) => (
        <AfterRow key={each.key} {...each.row} />
      ))}
    </AfterRows>
  );
}

/** A proposal after it is built, on the phone (`SCR-M06-18`). */
export function ProposalTrack(props: ProposalTrackProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={[...TRACK_WAIT_BARS]} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const ready: Ready = { ...props, detail: read.value };
  const { detail } = ready;
  const story = words.story(detail);
  return (
    <View style={styles.track}>
      {detail.shareBlockedBy === null ? null : (
        <Banner tone="warning" title={words.blockedTitle}>
          <Text variant="body-sm">{words.blockedLine(detail.shareBlockedBy)}</Text>
        </Banner>
      )}
      <HeroPanel name={words.heroName}>
        <View style={styles.hero}>
          <View style={styles.words}>
            <View style={styles.status}>
              <ProposalStatus standing={detail.standing} label={words.standing(detail.standing)} />
            </View>
            <Text variant="h1" style={styles.title}>
              {story.title}
            </Text>
            <Text variant="body" color="secondary">
              {story.line}
            </Text>
          </View>
          {props.cover === undefined ? null : (
            <Pressable accessibilityLabel={words.openDocument} onPress={props.onOpenDocument}>
              <View style={styles.cover}>{props.cover}</View>
            </Pressable>
          )}
        </View>
        <Acts {...ready} />
        <Steps {...ready} />
        <View style={styles.note}>
          <ShellGlyph name="info" size="sm" tone="secondary" />
          <Text variant="caption" color="secondary" style={styles.grow}>
            {words.neverDelivered}
          </Text>
        </View>
      </HeroPanel>
      <Rows {...ready} />
    </View>
  );
}

const DOT = theme.spacing['sp-6'];
const HALO = 5;

const styles = StyleSheet.create({
  track: { gap: theme.spacing['sp-5'] },
  grow: { flex: 1, minWidth: 0 },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-4'] },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-2'] },
  status: { alignSelf: 'flex-start' },
  title: {
    fontFamily: theme.type.families.display,
    fontWeight: '400',
    fontSize: theme.type.roles['display-phone'].fontSize,
    lineHeight: 34,
  },
  cover: { transform: [{ rotate: '3deg' }] },
  /* The acts stand one under the other, each its own words' width, as the approved design and the
     web half's phone room draw them. */
  acts: { alignItems: 'flex-start', gap: theme.spacing['sp-2'], marginTop: theme.spacing['sp-4'] },
  steps: { flexDirection: 'row', marginTop: theme.spacing['sp-6'] },
  step: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'], paddingTop: 34 },
  rail: {
    position: 'absolute',
    top: 11,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['line-soft'],
  },
  railDone: { backgroundColor: colors.accent },
  dot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DOT,
    height: DOT,
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors['line-strong'],
  },
  dotLit: { backgroundColor: colors.accent, borderColor: colors.accent },
  /* The step reached last wears a soft ring, as the web half's 5 px wash around its dot. */
  halo: {
    position: 'absolute',
    top: -HALO,
    left: -HALO,
    width: DOT + HALO * 2,
    height: DOT + HALO * 2,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['accent-subtle'],
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    marginTop: theme.spacing['sp-4'],
  },
});
