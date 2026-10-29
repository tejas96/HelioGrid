import { AllocationMeter } from '../AllocationMeter/AllocationMeter';
import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { SheetActions } from '../Sheet/SheetActions';
import type { PaymentTermsFootProps } from './PaymentTermsSettings.types';

/**
 * The editor's foot (`SCR-M01-20` m20-c2): the save-failed banner over the meter, then the acts.
 * The meter and *Save terms* read one verdict: while it is not met, Save stays focusable and says
 * why in its bubble (`disabledReason`), over a full-width *Cancel*; met, the two sit side by side.
 */
export function PaymentTermsFoot(props: PaymentTermsFootProps) {
  const { words } = props;
  return (
    <div className="hg-pay-foot">
      {props.saveFailed ? (
        <Banner kind="validation" density="functional" title={words.saveFailedTitle}>
          {props.saveFailedBody ?? words.saveFailedBody}
        </Banner>
      ) : null}
      <AllocationMeter
        label={words.allocation}
        parts={props.parts.map((part) => ({ label: part.label, value: part.value }))}
        tolerance={0}
        enforcement="immediate"
        enforcementNote={null}
        state={props.state}
        remainderWords={props.sentence}
        words={words.meter}
        density="functional"
      />
      {props.refusal === undefined ? (
        <SheetActions>
          <Button variant="ghost" size="md" onClick={props.onCancel}>
            {words.cancel}
          </Button>
          <Button variant="primary" size="md" loading={props.saving} onClick={props.onSave}>
            {words.save}
          </Button>
        </SheetActions>
      ) : (
        <div className="hg-pay-foot-refused">
          <Button variant="primary" size="md" fullWidth disabled disabledReason={props.refusal}>
            {words.save}
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={props.onCancel}>
            {words.cancel}
          </Button>
        </div>
      )}
    </div>
  );
}
