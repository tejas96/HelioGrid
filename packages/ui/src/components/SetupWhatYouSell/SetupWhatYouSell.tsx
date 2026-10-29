import { TYPICAL_SYSTEM_KWP } from '@heliogrid/domain';
import { useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { DoorTitle } from '../DoorFrame/DoorTitle';
import { NumberField } from '../NumberField/NumberField';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import { useRefusalAnswer } from './SetupWhatYouSell.logic';
import type { SetupWhatYouSellProps } from './SetupWhatYouSell.types';

/** What a question's box holds that takes the focus: the group's one tab stop, or the size's input. */
const FOCUS_STOP = '[role="radio"][tabindex="0"], input';

/**
 * The what-you-sell step in the frame's two fields: the question and its ask in the identity half —
 * after a failed save, one block holding what went wrong, its ask and the fix in their place; the kinds of business as a stacked list over the size field in the task,
 * and the way on under them. A refused `Continue` moves focus to the first question still owed.
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
  const kinds = useRef<HTMLDivElement>(null);
  const size = useRef<HTMLDivElement>(null);
  useRefusalAnswer(refusals, words, ({ question }) => {
    const box = question === 'segment' ? kinds.current : size.current;
    box?.querySelector<HTMLElement>(FOCUS_STOP)?.focus();
  });

  return (
    <DoorFrame
      trailing={null}
      taskMeasure="list"
      column={words.failure === null ? 'deep' : 'near'}
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
            className="hg-door-finding"
          />
        )
      }
      footer={
        <div
          className="hg-setup-what-you-sell-act"
          data-ways={words.secondary === null ? 'one' : 'two'}
        >
          <div className="hg-setup-what-you-sell-ways">
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
            {words.secondary === null ? null : (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={saving}
                onClick={onFinishLater}
              >
                {words.secondary}
              </Button>
            )}
          </div>
          {words.actLine === null ? null : (
            <Text
              variant="caption"
              color="secondary"
              align="center"
              className="hg-setup-what-you-sell-line"
            >
              {words.actLine}
            </Text>
          )}
        </div>
      }
    >
      <div className="hg-setup-what-you-sell-questions">
        <div ref={kinds}>
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
        </div>
        <div ref={size} className="hg-setup-what-you-sell-size">
          <Text variant="body-sm" color="secondary">
            {words.sizeHelper}
          </Text>
          <NumberField
            label={words.sizeLabel}
            words={words.numberField}
            unit={words.unit}
            value={typicalSystemKwp ?? undefined}
            precision={TYPICAL_SYSTEM_KWP.precision}
            steppers={false}
            error={words.sizeError ?? undefined}
            provenance={{ tier: 'estimated', source: words.sizeSource, emphasis: 'load-bearing' }}
            commits="as-typed"
            onCommit={onDeclareSize}
          />
        </div>
      </div>
    </DoorFrame>
  );
}
