import type { HomeToday as Today } from '@heliogrid/data/react';
import type { SettingsRow } from '@heliogrid/domain';
import { homeGlanceWords, readinessStepWords, readinessWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  GlanceStrip,
  homeGlanceFacts,
  ProposalReadiness,
  readinessSteps,
  useFormat,
} from '@heliogrid/ui';

/**
 * Home's own facts under its head (redesign direction A): the first-proposal hero with the next
 * step, then the day at a glance — both from `useHomeToday()`, each opening its settings page.
 */
export function HomeToday({ today, open }: { today: Today; open: (row: SettingsRow) => void }) {
  const t = useTranslate();
  const format = useFormat();
  const readiness = today.readiness;
  const ready = readiness?.kind === 'ready' ? readiness.value : null;
  const steps =
    ready === null ? [] : readinessSteps(ready.steps, (step) => readinessStepWords(t, step), open);
  const facts = homeGlanceFacts(today.glance, homeGlanceWords(t), format, open);
  return (
    <>
      {readiness === null ? null : (
        <ProposalReadiness
          words={readinessWords(t, ready ?? { done: 0, total: 0, complete: false })}
          done={ready?.done ?? 0}
          total={ready?.total ?? 0}
          steps={steps}
          next={steps.find((step) => step.key === ready?.next) ?? null}
          loading={readiness.kind !== 'ready'}
        />
      )}
      {facts.length < 2 ? null : <GlanceStrip facts={facts} name={homeGlanceWords(t).name} />}
    </>
  );
}
