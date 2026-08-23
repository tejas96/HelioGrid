/* The turns themselves (native), oldest first — and the in-flow language-switch marker, so a reader
   scrolling the conversation meets the change where it happened rather than only in the header. */

import { theme } from '@heliogrid/theme';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { clock, isCurrentTurn } from './Transcript.language';
import type { TranscriptTurn } from './Transcript.types';
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

interface TranscriptTurnListProps {
  /** The turns currently on screen — the window, not the whole call. */
  turns: TranscriptTurn[];
  /** Turn index → the language it switched to. */
  marks: Record<number, string>;
  currentAt?: number;
  agentName?: string;
  customerName?: string;
  onSeek?: (seconds: number) => void;
  density: 'expressive' | 'functional';
}

export function TranscriptTurnList({
  turns,
  marks,
  currentAt,
  agentName,
  customerName,
  onSeek,
  density,
}: TranscriptTurnListProps) {
  return (
    <View style={{ rowGap: TRANSCRIPT_GAP[density] }}>
      {turns.map((t, i) => {
        const switched = marks[i];
        const key = t.id ?? `${i}-${t.party}`;
        return (
          <Fragment key={key}>
            {switched ? (
              <View style={styles.switchRow}>
                <GlobeGlyph size={13} />
                <Text variant="caption" color="secondary" style={styles.switchWord}>
                  {`Switched to ${switched}${t.at !== undefined ? ` · ${clock(t.at)}` : ''}`}
                </Text>
              </View>
            ) : null}
            <TranscriptTurnRow
              turn={t}
              current={isCurrentTurn(turns, i, currentAt)}
              agentName={agentName}
              customerName={customerName}
              onSeek={onSeek}
              density={density}
            />
          </Fragment>
        );
      })}
    </View>
  );
}
