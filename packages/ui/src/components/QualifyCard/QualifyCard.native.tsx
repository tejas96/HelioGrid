import { QUALIFY_QUESTIONS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { FoldHead } from '../FoldHead/FoldHead.native';
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
  foldable,
  words,
}: QualifyCardProps) {
  const [opened, setOpen] = useState(!foldable);
  /* A save that came back undone opens the card, folded or not: its Try again is inside. */
  const failed =
    questions.some((each) => each.save?.status === 'failed') ||
    (markQualified !== null && markQualified.failure !== null);
  const open = opened || failed;
  const count = words.count(answered, QUALIFY_QUESTIONS.length);
  const dots = (
    <View style={styles.dots} importantForAccessibility="no-hide-descendants">
      {questions.map((view) => (
        <View
          key={view.question}
          style={[
            styles.dot,
            view.saved === null ? undefined : styles.dotOn,
            view.save?.status === 'failed' ? styles.dotFailed : undefined,
          ]}
        />
      ))}
    </View>
  );
  return (
    <View style={[tileSurface, styles.card]}>
      <GroundProvider ground="tile">
        {foldable ? (
          <FoldHead
            title={words.title}
            meta={count}
            aside={dots}
            open={open}
            onToggle={() => setOpen(!opened)}
          />
        ) : (
          <View style={styles.head}>
            <Text variant="overline" color="secondary">
              {words.title}
            </Text>
            <Text variant="body-sm" bold>
              {count}
            </Text>
            <View style={styles.headDots}>{dots}</View>
          </View>
        )}
        {open
          ? questions.map((view) => (
              <QualifyQuestion
                key={view.question}
                view={view}
                onAnswer={onAnswer}
                onRetry={onRetry}
                words={words}
              />
            ))
          : null}
        {open && markQualified !== null ? (
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
        ) : null}
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
  dots: { flexDirection: 'row', gap: theme.spacing['sp-1'] },
  headDots: { marginLeft: 'auto' },
  dot: {
    width: theme.spacing['sp-2'],
    height: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
  dotOn: { backgroundColor: colors['success-text'] },
  dotFailed: { backgroundColor: colors.danger },
  mark: { gap: theme.spacing['sp-2'], paddingTop: theme.spacing['sp-2'] },
});
