import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { RichText } from '../RichText/RichText';
import type { TermsStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepHint } from './StepParts';
import { termsDefaultSave, termsField, termsSave } from './step-fields';

/**
 * Step 9 (`M06-15`, `T-M06-011`): the terms in the one rich-text field, with their count and page
 * estimate. *Save as company default* is drawn only for who may set the company's terms; anyone
 * else reads that the change stays on this proposal.
 */
export function TermsStep({ view, shared }: { view: TermsStepView; shared: ProposalStepWords }) {
  const { words } = view;
  return (
    <div className="hg-pst-controls">
      <div className="hg-pst-field">
        <RichText {...termsField(view)} />
        <FieldSaveLine save={termsSave(view)} words={shared} />
      </div>
      {view.onSaveAsDefault === undefined ? (
        <StepHint>{words.staysHere}</StepHint>
      ) : (
        <div className="hg-pst-start">
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
        </div>
      )}
    </div>
  );
}
