import { useEndFirstRun, useRoleCard } from '@heliogrid/data/react';
import { roleCardWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { RoleExplainer } from '@heliogrid/ui';
import { InsetDoor } from '../shared/InsetDoor';
import { useGoInside } from '../shared/use-go-inside';

/**
 * The role card at first run on the phone (`SCR-M01-10`, `M01-15`): the step the invite landing or
 * First-Run Profile hands a new teammate to. The act opens the home the roles decide, and the card
 * leaves the stack with it.
 */
export function RoleExplainerScreen() {
  const t = useTranslate();
  const role = useRoleCard();
  const goInside = useGoInside();
  const endFirstRun = useEndFirstRun();
  return (
    <InsetDoor>
      <RoleExplainer
        words={roleCardWords(t, role.card, role.facts)}
        read={role.read}
        namesPending={role.namesPending}
        onAct={() => {
          endFirstRun();
          goInside();
        }}
      />
    </InsetDoor>
  );
}
