import { UI_LANGUAGES } from '@heliogrid/contracts';
import { LANGUAGE_META, SIGN_IN } from '@heliogrid/i18n';
import { useI18n, useTranslate } from '@heliogrid/i18n/react';
import { Button, Menu } from '@heliogrid/ui';

/**
 * The ghost control top-right: a shared field phone switches language before anyone signs in
 * (`SCR-M01-01` decision 4). Real, not drawn — it moves the mount's language at once (`F3-04`).
 */
export function LanguageControl() {
  const t = useTranslate();
  const { locale, setLocale } = useI18n();
  return (
    <Menu
      align="end"
      selection="single"
      label={t(SIGN_IN.changeLanguage)}
      trigger={
        <Button variant="ghost" size="sm">
          {LANGUAGE_META[locale].endonym}
        </Button>
      }
      items={UI_LANGUAGES.map((code) => ({
        key: code,
        label: LANGUAGE_META[code].endonym,
        selected: code === locale,
        onSelect: () => void setLocale(code),
      }))}
    />
  );
}
