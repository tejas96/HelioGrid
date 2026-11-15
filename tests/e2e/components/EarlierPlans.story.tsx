import type { EarlierPlan } from '@heliogrid/contracts';
import { createTranslator, projectMoneyWords } from '@heliogrid/i18n';
import { EarlierPlans } from '@heliogrid/ui';
import { EARLIER } from '../support/earlier-plans';

const en = await createTranslator('en');

/** The earlier plan folded under the live one, its words bound in the browser. */
export function EarlierPlansOnAProject({ plans = EARLIER }: { plans?: readonly EarlierPlan[] }) {
  return <EarlierPlans plans={plans} words={projectMoneyWords(en.t).earlier} />;
}
