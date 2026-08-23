import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { PROVENANCE_MARK, PROVENANCE_TEXT } from './ChartTokens.native';
import type { ProvenanceFacts } from './chart-provenance';
import { provenanceParts } from './chart-provenance';

interface ChartProvenanceProps {
  facts: ProvenanceFacts | null;
}

const DOT = 5;

const styles = StyleSheet.create({
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  part: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  strong: { fontWeight: '500' },
});

/**
 * One provenance line under the headline value — **word first, dot second** (F8-07). The dot is
 * the second, non-colour channel; removing it would lose a cue, never the meaning.
 */
export function ChartProvenance({ facts }: ChartProvenanceProps) {
  const parts = provenanceParts(facts);
  if (parts.length === 0) {
    return null;
  }
  return (
    <View style={styles.line}>
      {parts.map((part, index) => (
        <View key={part.id} style={styles.part}>
          {index > 0 ? (
            <Text variant="caption" color="tertiary">
              ·
            </Text>
          ) : null}
          {part.dot === undefined ? null : (
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: part.dot.customColor ?? PROVENANCE_MARK[part.dot.colorKey],
                } satisfies ViewStyle,
              ]}
            />
          )}
          <Text
            variant="caption"
            color={part.colorKey === undefined ? 'tertiary' : PROVENANCE_TEXT[part.colorKey]}
            style={part.strong === true ? styles.strong : undefined}
          >
            {part.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
