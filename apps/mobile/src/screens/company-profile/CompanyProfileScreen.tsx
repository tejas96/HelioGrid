import { useCompanyProfile } from '@heliogrid/data/react';
import { companyProfileStepWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CompanyProfile, useFormat } from '@heliogrid/ui';
import { pickImage } from '../../files/pick-image';
import { InsetDoor } from '../shared/InsetDoor';

/**
 * The third setup step on the phone (`SCR-M01-05`, `M01-24`), mounted for an owner whose company
 * still owes it. What is read, typed and saved is `useCompanyProfile`'s,
 * and every word is `companyProfileStepWords`'. A logo is chosen in the system's picker
 * (`pickImage`). This composes.
 */
export function CompanyProfileScreen() {
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const step = useCompanyProfile();
  const requestLogo = () => {
    void pickImage().then((image) => {
      if (image !== null) step.chooseLogo(image);
    });
  };
  return (
    <InsetDoor>
      <CompanyProfile
        words={companyProfileStepWords(t, locale, step, pack)}
        values={step.values}
        open={step.open}
        onOpen={step.openPart}
        onEdit={step.edit}
        onChooseSegment={step.chooseSegment}
        onDeclareSize={step.declareSize}
        saving={step.saving}
        onSave={step.save}
        onRetryRead={step.retryRead}
        onContinueWithout={step.continueWithout}
        logoPicture={step.logoPicture}
        onRequestLogo={requestLogo}
      />
    </InsetDoor>
  );
}
