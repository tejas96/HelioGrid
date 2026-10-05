import type { SignInWords } from '@heliogrid/i18n';
import { explainerPagerWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Explainer, PhoneValue, Text } from '@heliogrid/ui';

/** The code frame's title: what happened, its rule behind an Explainer, the number, and the Google login it links. */
export function CodeTitle({ words, phone }: { words: SignInWords; phone: string }) {
  const t = useTranslate();
  return (
    <div className="hg-door-title">
      <div className="hg-door-title-row">
        <Text variant="h1">{words.title}</Text>
        {words.explainer === null ? null : (
          <Explainer
            label={words.explainer.label}
            title={words.explainer.title}
            pages={words.explainer.page}
            {...explainerPagerWords(t)}
          />
        )}
      </div>
      <PhoneValue label={words.sub} value={phone} />
      {words.links === null ? null : (
        <Text variant="body-sm" color="secondary">
          {words.links}
        </Text>
      )}
    </div>
  );
}
