import type { SignInWords } from '@heliogrid/i18n';
import { explainerPagerWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Explainer, Text, useFormat } from '@heliogrid/ui';

/** The code frame's title: what happened, its rule behind an Explainer, the number, and the Google login it links. */
export function CodeTitle({ words, phone }: { words: SignInWords; phone: string }) {
  const t = useTranslate();
  const format = useFormat();
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
      {/* The lead-in is a line of its own, sentence case, the number under it (`SCR-M01-01` code family). */}
      <Text variant="body-sm" color="secondary">
        {words.sub}
      </Text>
      <Text variant="mono" bold>
        {format.phone(phone)}
      </Text>
      {words.links === null ? null : (
        <Text variant="body-sm" color="secondary">
          {words.links}
        </Text>
      )}
    </div>
  );
}
