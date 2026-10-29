/* The turns themselves (native), oldest first — and the in-flow language-switch marker, so a reader
   scrolling the conversation meets the change where it happened rather than only in the header. */

import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { turnEntriesOf } from './Transcript.logic';
import type { TranscriptTurnListProps } from './Transcript.types';
import { GlobeGlyph, TRANSCRIPT_GAP } from './TranscriptChrome.native';
import { TranscriptTurnRow } from './TranscriptTurnRow.native';

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-0-5'],
  },
  switchWord: { fontWeight: '500' },
});

export function TranscriptTurnList({
  turns,
  marks,
  currentAt,
  agentName,
  customerName,
  onSeek,
  density,
  words,
}: TranscriptTurnListProps) {
  return (
    <View style={{ rowGap: TRANSCRIPT_GAP[density] }}>
      {turnEntriesOf(turns, marks, currentAt, words).map(({ key, turn, current, switchLine }) => (
        <Fragment key={key}>
          {switchLine === null ? null : (
            <View style={styles.switchRow}>
              <GlobeGlyph size={13} />
              <Text variant="caption" color="secondary" style={styles.switchWord}>
                {switchLine}
              </Text>
            </View>
          )}
          <TranscriptTurnRow
            turn={turn}
            current={current}
            agentName={agentName}
            customerName={customerName}
            onSeek={onSeek}
            density={density}
            words={words}
          />
        </Fragment>
      ))}
    </View>
  );
}
