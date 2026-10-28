import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { Badge } from '../Chip/Chip';
import { Timeline } from '../Timeline/Timeline';
import type { PaymentTermsPickerProps } from './PaymentTermsSettings.types';

/**
 * The stage picker's body (`SCR-M01-20` m20-d, m20-h): the project's journey on one rail, each
 * stage with its glyph, the pack's label and the short *when*, the tranches already due there as
 * pills — this tranche's in the accent. A stage a project may skip takes the warning node and
 * *Can be skipped*, and stays choosable. Its foot (`PaymentTermsPickerFoot`) says the rule once.
 */
export function PaymentTermsPicker({
  words,
  label,
  stages,
  value,
  onChange,
}: PaymentTermsPickerProps) {
  return (
    <Timeline
      label={label}
      value={value}
      onChange={onChange}
      density="functional"
      items={stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        description: stage.short,
        icon: <ShellGlyph name={stage.glyph} size="sm" />,
        ...(stage.skippable
          ? {
              tone: 'warning' as const,
              marks: (
                <Badge tone="warning" density="functional">
                  {words.canBeSkipped}
                </Badge>
              ),
            }
          : {}),
        ...(stage.pills.length === 0
          ? {}
          : {
              content: (
                <div className="hg-pay-pills">
                  {stage.pills.map((pill) => (
                    <Badge
                      key={pill.key}
                      tone={pill.mine ? 'accent' : 'neutral'}
                      density="functional"
                    >
                      {pill.text}
                    </Badge>
                  ))}
                </div>
              ),
            }),
      }))}
    />
  );
}

/** The picker's foot: the skip rule in words, said once, beside *Done*. */
export function PaymentTermsPickerFoot({
  words,
  onDone,
}: Pick<PaymentTermsPickerProps, 'words'> & { onDone(): void }) {
  return (
    <div className="hg-pay-pick-foot">
      <Text variant="caption" color="secondary" className="hg-pay-grow hg-pay-pretty">
        {words.skipRule}
      </Text>
      <Button variant="primary" size="md" onClick={onDone}>
        {words.done}
      </Button>
    </div>
  );
}
