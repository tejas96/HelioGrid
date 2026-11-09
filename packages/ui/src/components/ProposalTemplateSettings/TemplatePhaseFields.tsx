import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';
import { TEMPLATE_PHASE_WHAT } from './ProposalTemplateSettings.logic';
import type { TemplatePhaseFieldsProps } from './ProposalTemplateSettings.types';

/**
 * The phase editor's body (m19-g, m19-l), for the app's sheet or side panel: *Phase name*, then
 * *What happens in this phase*, `sp-4` apart.
 */
export function TemplatePhaseFields({
  words,
  name,
  what,
  nameError,
  whatError,
  onName,
  onWhat,
}: TemplatePhaseFieldsProps) {
  return (
    <div className="hg-template-phase-fields">
      <Input
        label={words.phaseName}
        value={name}
        onChange={onName}
        density="functional"
        {...(nameError === undefined ? {} : { error: nameError })}
      />
      <Textarea
        label={words.phaseWhat}
        value={what}
        onChange={onWhat}
        rows={TEMPLATE_PHASE_WHAT.rows}
        maxLength={TEMPLATE_PHASE_WHAT.maxLength}
        density="functional"
        {...(whatError === undefined ? {} : { error: whatError })}
      />
    </div>
  );
}
