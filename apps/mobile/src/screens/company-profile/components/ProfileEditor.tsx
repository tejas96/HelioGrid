import { useCompanyProfile } from '@heliogrid/data/react';
import type { CompanyProfileLife } from '@heliogrid/domain';
import { COMPANY_PROFILE, companyProfileStepWords, toastHostWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { CompanyProfile, closeKeyboard, ToastHost, useFormat, useToasts } from '@heliogrid/ui';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage } from '../../../files/pick-image';
import { underPill } from '../../shell/styles';
import { styles } from '../styles';

/**
 * The company profile in one life, as both phone screens draw it (`SCR-M01-05`): what is read,
 * typed and saved is `useCompanyProfile`'s, every word is `companyProfileStepWords`', and a logo
 * is chosen in the system's picker (`pickImage`); a save that lands in settings raises a toast.
 * The screen around it is the chrome.
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
  const toasts = useToasts();
  const insets = useSafeAreaInsets();
  const step = useCompanyProfile(life, {
    onSaved: () => toasts.push({ tone: 'neutral', title: t(COMPANY_PROFILE.saved) }),
  });
  // The keyboard closes on the act: a toast at the pill's height would otherwise sit under it.
  const save = () => {
    closeKeyboard();
    step.save();
  };
  /* A closed toast hands the screen reader back to the profile it spoke about. */
  const page = useRef<View>(null);
  const requestLogo = () => {
    void pickImage().then((image) => {
      if (image !== null) step.chooseLogo(image);
    });
  };
  return (
    <>
      <View ref={page} style={styles.fill}>
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
          onSave={save}
          read={step.read}
          onContinueWithout={step.continueWithout}
          logoPicture={step.logoPicture}
          onRequestLogo={requestLogo}
        />
      </View>
      {/* A save that lands in settings says so (`SCR-M01-05` ruling 59); setup moves on instead. */}
      {/* Above the pill, which stands on the device's home-bar inset — the package reads no inset. */}
      <ToastHost
        toasts={toasts.toasts}
        onDismiss={toasts.dismiss}
        {...toastHostWords(t)}
        focusAfter={page}
        offset={underPill(insets.bottom) + theme.spacing['sp-6']}
      />
    </>
  );
}
