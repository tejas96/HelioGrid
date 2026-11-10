import { QUALIFY_QUESTIONS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import type { QualifyCardProps } from './QualifyCard.types';
import { QualifyQuestion } from './QualifyQuestion.native';

/**
 * The six qualifying questions inline on the lead (`M02-39`), on the phone: no form and no
 * submit — each answer saves alone, the count and the dots follow the record, and Mark qualified
 * (`M02-45`) sits under them while the stage offers it.
 */
export function QualifyCard({
  questions,
  answered,
  onAnswer,
  onRetry,
  markQualified,
  words,
}: QualifyCardProps) {
  return (
    <View style={[tileSurface, styles.card]}>
      <GroundProvider ground="tile">
        <View style={styles.head}>
          <Text variant="overline" color="secondary">
            {words.title}
          </Text>
          <Text variant="body-sm" bold>
            {words.count(answered, QUALIFY_QUESTIONS.length)}
          </Text>
          <View style={styles.dots} importantForAccessibility="no-hide-descendants">
            {questions.map((view) => (
              <View
                key={view.question}
                style={[styles.dot, view.saved === null ? undefined : styles.dotOn]}
              />
            ))}
          </View>
        </View>
        {questions.map((view) => (
          <QualifyQuestion
            key={view.question}
            view={view}
            onAnswer={onAnswer}
            onRetry={onRetry}
            words={words}
          />
        ))}
        {markQualified === null ? null : (
          <View style={styles.mark}>
            <Button
              variant="secondary"
              size="md"
              loading={markQualified.pending}
              onClick={markQualified.onPress}
            >
              {words.markQualified}
            </Button>
            <Text variant="body-sm" color="secondary">
              {words.markQualifiedLine}
            </Text>
            {markQualified.failure === null ? null : (
              <Text variant="body-sm" color="danger" live>
                {markQualified.failure}
              </Text>
            )}
          </View>
        )}
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing['sp-1'],
    marginLeft: 'auto',
  },
  dot: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
  dotOn: { backgroundColor: colors['success-text'] },
  mark: { gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-2'] },
});
