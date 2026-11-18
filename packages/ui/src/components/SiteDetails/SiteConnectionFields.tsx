import { Text } from '../../primitives/Text/Text';
import { Input } from '../Input/Input';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Select } from '../Select/Select';
import {
  areaOptionsOf,
  operatorFieldOf,
  phaseOf,
  phaseOptionsOf,
  SITE_LOAD_MAX_LENGTH,
  type SiteConnectionFieldsProps,
} from './SiteDetails.logic';

/**
 * The connection, under its own overline: the state and its operator, then the supply phase and
 * the sanctioned load. None is asked for — each can be filled later.
 */
export function SiteConnectionFields({
  form,
  areas,
  operators,
  saving,
  acts,
  words,
}: SiteConnectionFieldsProps) {
  const operator = operatorFieldOf(form, areas, operators, words);
  return (
    <>
      <Text variant="overline" color="secondary" className="hg-site-over hg-site-wide">
        {words.connection}
      </Text>
      <Select
        label={words.state}
        value={form.area?.area}
        placeholder={words.statePlaceholder}
        closeLabel={words.closeList}
        options={areaOptionsOf(areas)}
        disabled={saving}
        helper={form.areaFromPlace ? words.stateFromPlace : undefined}
        onChange={acts.onArea}
      />
      <Select
        label={words.operator}
        value={form.utilityOperator ?? undefined}
        placeholder={operator.placeholder}
        closeLabel={words.closeList}
        options={[...operators]}
        disabled={saving || operator.disabled}
        helper={operator.helper}
        onChange={acts.onOperator}
      />
      <SegmentedControl
        label={words.phase}
        fill
        value={form.supplyPhase}
        options={phaseOptionsOf(words)}
        onChange={(value) => {
          const phase = phaseOf(value);
          if (phase !== null && !saving) acts.onPhase(phase);
        }}
      />
      <Input
        label={words.load}
        mono
        value={form.sanctionedLoad}
        maxLength={SITE_LOAD_MAX_LENGTH}
        trailing={
          <Text variant="body-sm" color="secondary" as="span">
            {words.loadUnit}
          </Text>
        }
        disabled={saving}
        helper={form.sanctionedLoad === '' ? words.loadLater : undefined}
        onChange={acts.onLoad}
      />
    </>
  );
}
