/* The header of one transcript (native) — its name, the call's identity line, THE ONE LANGUAGE
   LABEL, why the words are here without the audio, and the count line. */

import type { TranslatedText } from '@heliogrid/contracts';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { GlobeGlyph } from './TranscriptChrome.native';

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 14 },
  language: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageWord: { fontWeight: '500', flexShrink: 1 },
});

interface TranscriptHeaderProps {
  title: TranslatedText;
  meta?: TranslatedText;
  /** The whole language fact in one sentence, or `null` when it was never recorded. */
  sentence: TranslatedText | null;
  retainedNote?: TranslatedText;
  /** "12 turns · Suryodaya agent and Anil Kulkarni", only once the turns are actually here. */
  count: TranslatedText | null;
  /** The named gap when the language was never recorded. */
  notRecorded: TranslatedText;
}

export function TranscriptHeader({
  title,
  meta,
  sentence,
  retainedNote,
  count,
  notRecorded,
}: TranscriptHeaderProps) {
  return (
    <View style={styles.header}>
      <Text variant="overline" color="tertiary">
        {title}
      </Text>
      {meta ? (
        <Text variant="body-sm" color="secondary">
          {meta}
        </Text>
      ) : null}
      {/* The language label — one per transcript, saying the whole shape of what happened. */}
      {sentence ? (
        <View style={styles.language}>
          <GlobeGlyph />
          <Text variant="body-sm" color="secondary" style={styles.languageWord}>
            {sentence}
          </Text>
        </View>
      ) : (
        <NamedGap gap={notRecorded} scale="field" />
      )}
      {retainedNote ? (
        <Text variant="caption" color="tertiary">
          {retainedNote}
        </Text>
      ) : null}
      {count ? (
        <Text variant="caption" color="tertiary">
          {count}
        </Text>
      ) : null}
    </View>
  );
}
