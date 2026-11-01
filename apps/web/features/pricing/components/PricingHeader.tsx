import type { TranslatedText } from '@heliogrid/contracts';
import { useLanguageChoice } from '@heliogrid/i18n/react';
import { Button, DoorLanguage, Wordmark } from '@heliogrid/ui';
import type { ReactNode } from 'react';

interface PricingHeaderProps {
  signIn: TranslatedText;
  onSignIn: () => void;
  /** The trial act sits here at 1536; absent where there are no prices (`SCR-M12-01` 3, 4). */
  trial: ReactNode;
}

/** The pre-auth header `SCR-M01-01` carries: the wordmark, the language, `Sign in` — no shell. */
export function PricingHeader({ signIn, onSignIn, trial }: PricingHeaderProps) {
  return (
    <header className="hg-pricing-header">
      <div className="hg-pricing-header__row">
        <span className="hg-pricing-header__mark">
          <Wordmark />
        </span>
        <div className="hg-pricing-header__acts">
          <DoorLanguage {...useLanguageChoice()} />
          <Button variant="secondary" size="sm" onClick={onSignIn}>
            {signIn}
          </Button>
          {trial === null ? null : <div className="hg-pricing-header__trial">{trial}</div>}
        </div>
      </div>
    </header>
  );
}
