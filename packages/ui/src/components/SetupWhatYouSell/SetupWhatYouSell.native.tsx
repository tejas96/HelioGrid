import { TYPICAL_SYSTEM_KWP } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { DoorTitle } from '../DoorFrame/DoorTitle.native';
import { NumberField } from '../NumberField/NumberField.native';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup.native';
import { TintedBlock } from '../TintedBlock/TintedBlock.native';
import { useRefusalAnswer } from './SetupWhatYouSell.logic';
import type { SetupWhatYouSellProps } from './SetupWhatYouSell.types';

/**
 * The what-you-sell step in the phone's one column: the question with its ask — after a failed
 * save, one block holding what went wrong, its ask and the fix — then the kinds of business and
 * the size field, with the way on held under the scrolling column.
 * React Native cannot move focus into a radio group, so a refused `Continue` says the first owed
 * question's error instead.
 */
export function SetupWhatYouSell({
  words,
  segment,
  onChooseSegment,
  typicalSystemKwp,
  onDeclareSize,
  saving,
  refusals,
  onContinue,
  onFinishLater,
}: SetupWhatYouSellProps) {
  useRefusalAnswer(refusals, words, ({ error }) => {
    AccessibilityInfo.announceForAccessibility(error);
  });

  return (
    <DoorFrame
      trailing={null}
      column="deep"
      identity={
        words.failure === null ? (
          <DoorTitle title={words.title} explainer={words.explainer} />
        ) : (
          <TintedBlock
            tone="danger"
            heading
            title={words.title}
            explainer={words.explainer}
            body={words.failure}
            announce="alert"
          />
        )
      }
      footer={
        <View style={styles.act}>
          <View style={styles.ways}>
            <View style={styles.way}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={saving}
                disabled={words.waiting !== null}
                disabledReason={words.waiting ?? undefined}
                onClick={onContinue}
              >
                {words.primary}
              </Button>
            </View>
            {words.secondary === null ? null : (
              <View style={styles.way}>
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={saving}
                  onClick={onFinishLater}
                >
                  {words.secondary}
                </Button>
              </View>
            )}
          </View>
          {words.actLine === null ? null : (
            <Text variant="caption" color="secondary" align="center">
              {words.actLine}
            </Text>
          )}
        </View>
      }
    >
      <View style={styles.questions}>
        <OptionCardGroup
          label={words.group}
          options={[...words.options]}
          value={segment ?? undefined}
          error={words.groupError ?? undefined}
          onChange={(value) => {
            const chosen = words.options.find((option) => option.value === value);
            if (chosen !== undefined) onChooseSegment(chosen.value);
          }}
        />
        <View style={styles.size}>
          <Text variant="body-sm" color="secondary">
            {words.sizeHelper}
          </Text>
          <NumberField
            label={words.sizeLabel}
            unit={words.unit}
            value={typicalSystemKwp ?? undefined}
            precision={TYPICAL_SYSTEM_KWP.precision}
            steppers={false}
            error={words.sizeError ?? undefined}
            provenance={{ tier: 'estimated', source: words.sizeSource, emphasis: 'load-bearing' }}
            onCommit={onDeclareSize}
          />
        </View>
      </View>
    </DoorFrame>
  );
}

const styles = StyleSheet.create({
  /** The questions `sp-5` under what leads them, `sp-4` apart (`SCR-M01-04`, `m-default`). */
  questions: { paddingTop: theme.spacing['sp-5'], gap: theme.spacing['sp-4'] },
  /** The helper line `sp-2` over the field it guides. */
  size: { gap: theme.spacing['sp-2'] },
  /** The way on `sp-2` over its one line. */
  act: { gap: theme.spacing['sp-2'] },
  /** After a failed save the two ways on share the row, 12 apart (`m-error`). */
  ways: { flexDirection: 'row', gap: theme.spacing['sp-3'] },
  /** Each way on takes an equal share of the row; a lone one takes it all. */
  way: { flex: 1 },
});
