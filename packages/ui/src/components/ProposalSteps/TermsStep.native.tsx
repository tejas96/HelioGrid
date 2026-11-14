import { View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { RichText } from '../RichText/RichText.native';
import type { TermsStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepHint, stepLayout } from './StepParts.native';
import { termsDefaultSave, termsField, termsSave } from './step-fields';

/**
 * Step 9 (`M06-15`, `T-M06-011`): the terms in the one rich-text field, with their count and page
 * estimate. *Save as company default* is drawn only for who may set the company's terms; anyone
 * else reads that the change stays on this proposal.
 */
export function TermsStep({ view, shared }: { view: TermsStepView; shared: ProposalStepWords }) {
  const { words } = view;
  return (
    <View style={stepLayout.column}>
      <View style={stepLayout.field}>
        <RichText {...termsField(view)} />
        <FieldSaveLine save={termsSave(view)} words={shared} />
      </View>
      {view.onSaveAsDefault === undefined ? (
        <StepHint>{words.staysHere}</StepHint>
      ) : (
        <View style={stepLayout.field}>
          <Button
            variant="secondary"
            size="md"
            loading={view.savingDefault === true}
            icon={<ShellGlyph name="download" size="sm" />}
            onClick={view.onSaveAsDefault}
          >
            {words.saveAsDefault}
          </Button>
          <FieldSaveLine save={termsDefaultSave(view)} words={shared} />
        </View>
      )}
    </View>
  );
}
