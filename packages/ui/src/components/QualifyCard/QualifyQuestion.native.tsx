import type { TranslatedText } from '@heliogrid/contracts';
import type { QualifyChoiceQuestion, QualifyQuestionView } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { useFormat } from '../MarketProvider/market-context';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { NumberField } from '../NumberField/NumberField.native';
import type { QualifyCardProps } from './QualifyCard.types';

interface QualifyQuestionProps extends Pick<QualifyCardProps, 'onAnswer' | 'onRetry' | 'words'> {
  readonly view: QualifyQuestionView;
}

/**
 * One qualifying question (`M02-39`): its label with the gap, the *Saved* mark or the saving word;
 * the bill as a money field with its `assumed` tier, or the answers as chips — and, when its answer
 * came back unsaved, the alert on that chip and *Not saved · Try again* under it alone.
 */
export function QualifyQuestion({ view, onAnswer, onRetry, words }: QualifyQuestionProps) {
  const label = useRef<View>(null);
  const failed = view.save?.status === 'failed' ? view.save : null;
  const retry = () => {
    onRetry(view.question);
    focusScreenReaderOn(() => label.current);
  };
  return (
    <View style={styles.question}>
      <View ref={label} accessible style={styles.head}>
        <Text variant="body-sm" bold>
          {words.question[view.question]}
        </Text>
        {view.saved === null && view.save === null ? <NamedGap gap={words.notAsked} /> : null}
        {view.save?.status === 'saving' ? (
          <Text variant="caption" color="secondary">
            {words.saving}
          </Text>
        ) : null}
        {view.savedMark ? <SavedMark word={words.saved} /> : null}
      </View>
      {view.question === 'monthlyBill' ? (
        <BillField view={view} onAnswer={onAnswer} words={words} />
      ) : (
        <Choices
          question={view.question}
          view={view}
          failedValue={failed?.value ?? null}
          onAnswer={onAnswer}
          words={words}
        />
      )}
      {failed === null ? null : (
        <View style={styles.fail} accessibilityLiveRegion="polite">
          <ShellGlyph name="alert" size="sm" tone="danger" />
          <Text variant="body-sm" color="danger" style={styles.failWords}>
            {words.notSaved}
          </Text>
          <Button variant="secondary" size="sm" onClick={retry}>
            {words.retry}
          </Button>
        </View>
      )}
    </View>
  );
}

function SavedMark({ word }: { word: TranslatedText }) {
  return (
    <View style={styles.saved}>
      <ShellGlyph name="tick" size="sm" tone="success" />
      <Text variant="caption" color="success">
        {word}
      </Text>
    </View>
  );
}

/** The monthly bill, typed in the tenant's currency and tiered `assumed` (`F8-01`). */
function BillField({ view, onAnswer, words }: Omit<QualifyQuestionProps, 'onRetry'>) {
  const format = useFormat();
  const shown = view.shown === null ? undefined : Number(view.shown);
  return (
    <NumberField
      words={words.billField}
      ariaLabel={words.question.monthlyBill}
      value={shown}
      onCommit={(amount) => onAnswer('monthlyBill', String(amount))}
      onClear={() => onAnswer('monthlyBill', null)}
      currency
      outOfRange="refuse"
      min={0}
      precision={format.pack.minorUnitDigits}
      provenance="assumed"
      density="functional"
    />
  );
}

interface ChoicesProps extends Omit<QualifyQuestionProps, 'onRetry'> {
  readonly question: QualifyChoiceQuestion;
  readonly failedValue: string | null;
}

/** The answers as chips, one chosen: a tap saves it at once (`M02-39`, no submit). */
function Choices({ question, view, failedValue, onAnswer, words }: ChoicesProps) {
  const { controlFill } = useGround();
  return (
    <View style={styles.choices} accessibilityRole="radiogroup">
      {view.choices.map((value) => {
        const chosen = view.shown === value;
        const failed = failedValue === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: chosen }}
            accessibilityLabel={words.choice(question, value)}
            onPress={() => onAnswer(question, value)}
            style={[
              styles.choice,
              { backgroundColor: controlFill },
              chosen ? styles.chosen : undefined,
              failed ? styles.failedChoice : undefined,
            ]}
          >
            {failed ? <ShellGlyph name="alert" size="sm" tone="danger" /> : null}
            <Text variant="body-sm" style={chosen ? styles.chosenWords : undefined}>
              {words.choice(question, value)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  question: {
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-3'],
    borderTopWidth: 1,
    borderTopColor: colors['line-soft'],
  },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  saved: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-0-5'] },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
  },
  /* The chosen answer is the accent wash, as the web's chosen Chip is. */
  chosen: { backgroundColor: colors['accent-subtle'] },
  chosenWords: { color: colors['accent-text'] },
  failedChoice: { borderWidth: 1, borderColor: colors['danger-text'] },
  fail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  failWords: { flexShrink: 1 },
});
