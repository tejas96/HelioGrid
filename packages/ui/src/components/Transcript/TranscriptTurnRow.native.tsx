/* Transcript's turn (native) — the speaker in ActorClass's own words and glyph, the offset as a
   real 44px seek control when the recording is still playable, and the words themselves. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ACTOR_CLASSES } from '../ActorClass';
import { ActorGlyph } from '../ActorClass/ActorClass.native';
import { renderMarks } from '../ChipGroup/ChipGroup.native';
import { clock } from './Transcript.language';
import type { TranscriptParty, TranscriptTurn } from './Transcript.types';
import { PARTY_CLASS } from './TranscriptTurnRow.logic';

const PARTY_WORD: Record<TranscriptParty, string> = { agent: 'Agent', customer: 'Customer' };

const styles = StyleSheet.create({
  turn: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minWidth: 0 },
  offsetCell: { width: 44, flexShrink: 0 },
  offsetText: { paddingTop: 3, textAlign: 'right' },
  seek: { width: 44, marginVertical: -8, borderRadius: theme.radius['r-sm'] },
  face: { fontFamily: theme.type.families.mono },
  faceCurrent: { fontWeight: '700', color: theme.colors.accent },
  /* Every turn is a tile (`tileSurface`), whichever party spoke it: the speaker line tells the two
     apart, never a fill. */
  bubble: { flex: 1, minWidth: 0, borderRadius: theme.radius['r-md'] },
  bubbleFunctional: { borderRadius: theme.radius['r-card-functional'] },
  bubbleCurrent: { backgroundColor: theme.colors['accent-subtle'] },
  speaker: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speakerWord: { fontWeight: '500' },
  words: { marginTop: theme.spacing['sp-1'] },
  marks: { marginTop: theme.spacing['sp-2'] },
});

const PAD = { expressive: 14, functional: 11 };

function Offset({
  at,
  onSeek,
  current,
  title,
}: {
  at?: number;
  onSeek?: (seconds: number) => void;
  current: boolean;
  title: string;
}) {
  const label = clock(at);
  if (label === null || at === undefined) {
    return <View style={styles.offsetCell} />;
  }
  const face = (
    <Text
      variant="caption"
      color={current ? 'accent' : 'tertiary'}
      style={[styles.face, current ? styles.faceCurrent : null]}
    >
      {label}
    </Text>
  );
  if (!onSeek) {
    return <View style={[styles.offsetCell, styles.offsetText]}>{face}</View>;
  }
  return (
    <Pressable
      onPress={() => onSeek(at)}
      accessibilityLabel={`Play the call from ${label}, ${title}`}
      style={styles.seek}
    >
      {face}
    </Pressable>
  );
}

export function TranscriptTurnRow({
  turn,
  current,
  agentName,
  customerName,
  onSeek,
  density,
}: {
  turn: TranscriptTurn;
  current: boolean;
  agentName?: string;
  customerName?: string;
  onSeek?: (seconds: number) => void;
  density: 'expressive' | 'functional';
}) {
  const party: TranscriptParty = turn.party === 'customer' ? 'customer' : 'agent';
  const isAgent = party === 'agent';
  const name = isAgent ? agentName : customerName;
  const descriptor = ACTOR_CLASSES[PARTY_CLASS[party]];
  return (
    <View style={styles.turn}>
      <Offset at={turn.at} onSeek={onSeek} current={current} title={`${PARTY_WORD[party]} turn`} />
      <View
        style={[
          tileSurface,
          styles.bubble,
          density === 'functional' ? styles.bubbleFunctional : null,
          current ? styles.bubbleCurrent : null,
          { padding: PAD[density] },
        ]}
      >
        <GroundProvider ground="tile">
          {/* The speaker, in ActorClass's own words and glyph — the stream's vocabulary. */}
          <View style={styles.speaker}>
            <ActorGlyph
              actorClass={PARTY_CLASS[party]}
              size={13}
              color={isAgent ? theme.colors.info : theme.colors.accent}
            />
            <Text variant="caption" color="secondary" style={styles.speakerWord}>
              {name ? `${name} · ${PARTY_WORD[party].toLowerCase()}` : descriptor.word()}
            </Text>
          </View>
          <Text variant={density === 'expressive' ? 'body' : 'body-sm'} style={styles.words}>
            {turn.text}
          </Text>
          {turn.marks ? <View style={styles.marks}>{renderMarks(turn.marks)}</View> : null}
        </GroundProvider>
      </View>
    </View>
  );
}
