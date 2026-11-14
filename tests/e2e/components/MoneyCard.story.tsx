import type { ProjectMoneyGlance } from '@heliogrid/contracts';
import { createTranslator, moneyCardWords } from '@heliogrid/i18n';
import { MoneyCard } from '@heliogrid/ui';

const en = await createTranslator('en');

/** The project's Money card, its words bound in the browser (its lines are functions it calls while it renders). */
export function MoneyCardOnAProject({ money }: { money: ProjectMoneyGlance }) {
  return (
    <MoneyCard
      money={money}
      today="2026-11-14"
      words={moneyCardWords(en.t)}
      onOpen={() => undefined}
    />
  );
}
