import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar/Avatar';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { areaSelects } from './ProposalSteps.logic';
import type { ClientStepView } from './ProposalSteps.types';
import type { ProposalStepWords } from './ProposalSteps.words.types';
import { FieldSaveLine, StepFacts } from './StepParts';

/**
 * Step 10 (`M06-16`, `T-M06-012`): the customer comes from the lead, locked; the site's address is
 * the one field, and it is saved on the lead. The number is the server's, never typed.
 */
export function ClientStep({ view, shared }: { view: ClientStepView; shared: ProposalStepWords }) {
  const { words } = view;
  const selects = view.area === undefined ? null : areaSelects(view.area, words);
  return (
    <div className="hg-pst-controls">
      <div className="hg-pst-client hg-pst-tile">
        <Avatar name={view.name} size={48} hue="teal" />
        <span className="hg-pst-client-words">
          <span className="hg-pst-client-name">{view.name}</span>
          {view.phone === undefined ? null : (
            <span className="hg-pst-client-phone">{view.phone}</span>
          )}
        </span>
        <span className="hg-pst-lock">
          <ShellGlyph name="lock" size="sm" />
          {words.fromLead}
        </span>
      </div>
      <div className="hg-pst-field">
        <Input
          label={words.address}
          value={view.address}
          commitOnBlur
          onCommit={view.onAddress}
          helper={words.addressHelper}
          {...(view.addressMissing ? { error: words.addressMissing } : {})}
        />
        <FieldSaveLine save={view.saves?.address} words={shared} />
      </div>
      {selects === null ? null : (
        <div className="hg-pst-field">
          <Select {...selects[0]} />
          <Select {...selects[1]} />
          <FieldSaveLine save={view.saves?.area} words={shared} />
        </div>
      )}
      <StepFacts facts={view.facts} />
    </div>
  );
}
