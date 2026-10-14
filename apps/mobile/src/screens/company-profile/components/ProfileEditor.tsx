import { useCompanyProfile } from '@heliogrid/data/react';
import type { CompanyProfileLife } from '@heliogrid/domain';
import { companyProfileStepWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CompanyProfile, useFormat } from '@heliogrid/ui';
import { pickImage } from '../../../files/pick-image';

/**
 * The company profile in one life, as both phone screens draw it (`SCR-M01-05`): what is read,
 * typed and saved is `useCompanyProfile`'s, every word is `companyProfileStepWords`', and a logo
 * is chosen in the system's picker (`pickImage`). The screen around it is the chrome.
 */
export function ProfileEditor({
  life,
  titleInBar = false,
}: {
  life: CompanyProfileLife;
  titleInBar?: boolean;
}) {
  const { t, locale } = useI18n();
  const { pack } = useFormat();
  const step = useCompanyProfile(life);
  const requestLogo = () => {
    void pickImage().then((image) => {
      if (image !== null) step.chooseLogo(image);
    });
  };
  return (
    <CompanyProfile
      life={life}
      titleInBar={titleInBar}
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
  );
}
