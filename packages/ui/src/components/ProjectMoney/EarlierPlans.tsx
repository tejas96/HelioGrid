import { useState } from 'react';
import { Card } from '../Card';
import { FoldHead } from '../FoldHead';
import { useFormat } from '../MarketProvider';
import { amountsOf } from './ProjectMoney.logic';
import type { EarlierPlansProps } from './ProjectMoney.parts.types';

/**
 * The earlier plan under the live one, on the web (`T-M06-025`, `M11-14`): one folded card, its
 * replaced plans newest first, each part's amount in mono (`CLAUDE.md` §9; no tier on the payments
 * surfaces, `F8-01`).
 */
export function EarlierPlans({ plans, words }: EarlierPlansProps) {
  const format = useFormat();
  const [open, setOpen] = useState(false);
  if (plans.length === 0) return null;
  return (
    <section aria-label={words.title}>
      <Card density="functional" className="hg-money-card">
        <FoldHead
          title={words.title}
          meta={words.count(plans.length)}
          open={open}
          onToggle={() => setOpen(!open)}
        />
        {open ? (
          <div className="hg-money-earlier">
            {plans.map((plan) => (
              <div key={`${plan.version ?? 'won'}-${plan.replacedAt}`}>
                <p className="hg-money-quiet">
                  {words.plan(
                    { version: plan.version, name: plan.replacedBy?.name ?? null },
                    format.date(plan.replacedAt),
                  )}
                </p>
                <ul className="hg-money-rows">
                  {plan.parts.map((part) => (
                    <li key={part.id} className="hg-money-row">
                      <span className="hg-money-entry-text hg-money-entry">
                        <span className="hg-money-entry-title">{part.label}</span>
                        <span className="hg-money-entry-line">
                          {words.dueAt(format.word('stage', part.dueOnStage))}
                        </span>
                      </span>
                      <span className="hg-money-figure">
                        {format.moneyPlain(part.amount, amountsOf(plan))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
