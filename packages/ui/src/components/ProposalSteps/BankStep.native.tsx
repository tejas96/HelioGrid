import { BANK_FACTS, type BankDetails } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Input } from '../Input/Input.native';
import { ProposalBankBlock } from '../ProposalBlocks/ProposalBlocks.native';
import { Switch } from '../Switch/Switch.native';
import type { BankField, BankStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepHint, StepTile, stepLayout } from './StepParts.native';

function BankFields({
  view,
  details,
  onDetail,
  shared,
}: {
  view: BankStepView;
  details: BankDetails;
  onDetail: (field: BankField, value: string) => void;
  shared: ProposalStepWords;
}) {
  return (
    <View style={stepLayout.column}>
      {BANK_FACTS.map((field) => (
        <View style={stepLayout.field} key={field}>
          <Input
            label={view.words.fields[field]}
            value={details[field]}
            mono={field === 'accountNumber' || field === 'bankRoutingIdentifier'}
            commitOnBlur
            onCommit={(value) => onDetail(field, value)}
          />
          <FieldSaveLine save={view.saves?.[field]} words={shared} />
        </View>
      ))}
    </View>
  );
}

/**
 * Step 11 (`M06-17`, `T-M06-013`): the account as the customer reads it, one switch to print it or
 * not, and the fields only for who may write the company's account — anyone else reads who can.
 */
export function BankStep({
  view,
  wide,
  shared,
}: {
  view: BankStepView;
  wide: boolean;
  shared: ProposalStepWords;
}) {
  const { words, bank, edit } = view;
  return (
    <>
      {wide || bank === null ? null : (
        <StepTile style={styles.card}>
          <ProposalBankBlock mode="app" {...bank} />
        </StepTile>
      )}
      <View style={stepLayout.column}>
        <Switch
          checked={view.include}
          onChange={view.onInclude}
          label={words.include}
          description={words.includeLine}
        />
        {bank === null && edit === undefined ? <StepHint>{words.none}</StepHint> : null}
        {edit === undefined ? (
          <StepHint glyph="lock">{words.whoCan}</StepHint>
        ) : (
          <BankFields view={view} details={edit.details} onDetail={edit.onDetail} shared={shared} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({ card: { padding: theme.spacing['sp-5'] } });
