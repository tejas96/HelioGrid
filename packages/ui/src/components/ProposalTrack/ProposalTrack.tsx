import type { ProposalDetail } from '@heliogrid/contracts';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { Button } from '../Button';
import { FailedRead } from '../EmptyState';
import { HeroPanel } from '../HeroPanel';
import { LoadingBars } from '../LoadingBars';
import { AfterRow, AfterRows, failedReadOf } from '../ProposalAfterParts';
import { ProposalStatus } from '../ProposalStatus';
import {
  TRACK_ACT_GLYPH,
  TRACK_WAIT_BARS,
  trackActsOf,
  trackNodeState,
  trackReached,
  trackRowViewsOf,
} from './ProposalTrack.logic';
import type { ProposalTrackProps, TrackAct } from './ProposalTrack.types';
import './ProposalTrack.css';

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
    <>
      <div className="hg-track-acts">
        {button(acts.main, 'primary')}
        {acts.second === null ? null : button(acts.second, 'secondary')}
      </div>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
    </>
  );
}

function Steps({ detail, words }: Ready) {
  const reached = trackReached(detail.tracking);
  return (
    <ol className="hg-track-steps" aria-label={words.trackName}>
      {words.nodes(detail.tracking).map((node, index) => {
        const at = trackNodeState(index, reached);
        return (
          <li key={node.name} className="hg-track-step" data-at={at}>
            <span className="hg-track-dot" aria-hidden="true">
              {at === 'ahead' ? null : <ShellGlyph name="check" size="sm" tone="inverse" />}
            </span>
            <b>{node.name}</b>
            <span>{node.when}</span>
          </li>
        );
      })}
    </ol>
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

/** A proposal after it is built, on the web (`SCR-M06-18`). */
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
    <div className="hg-track">
      {detail.shareBlockedBy === null ? null : (
        <Banner tone="warning" title={words.blockedTitle}>
          {words.blockedLine(detail.shareBlockedBy)}
        </Banner>
      )}
      <HeroPanel name={words.heroName}>
        <div className="hg-track-hero">
          <div className="hg-track-words" key={detail.standing}>
            <ProposalStatus standing={detail.standing} label={words.standing(detail.standing)} />
            <h2>{story.title}</h2>
            <p>{story.line}</p>
            <Acts {...ready} />
          </div>
          {props.cover === undefined ? null : (
            <Pressable
              className="hg-track-cover"
              accessibilityLabel={words.openDocument}
              onPress={props.onOpenDocument}
            >
              {props.cover}
            </Pressable>
          )}
        </div>
        <Steps {...ready} />
        <p className="hg-track-note">
          <ShellGlyph name="info" size="sm" tone="secondary" />
          <span>{words.neverDelivered}</span>
        </p>
      </HeroPanel>
      <Rows {...ready} />
    </div>
  );
}
