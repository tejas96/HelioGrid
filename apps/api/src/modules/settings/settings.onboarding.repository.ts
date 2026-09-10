import { type Db, onboardingProgress, withTenantTransaction } from '@heliogrid/db';
import {
  ONBOARDING_STEPS,
  type OnboardingStep,
  type PromptPointStates,
  type StepStates,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { RUNTIME_DB } from '../../common/db/runtime.token';

/** The corridor's row as stored; `resumeStep` is kept in step with the states for the resume read. */
export interface ProgressRow {
  readonly resumeStep: OnboardingStep | null;
  readonly stepStates: StepStates;
  readonly promptPointStates: PromptPointStates;
}

/**
 * Where setup stands (`M01-10`), on the runtime pool. Seeded at creation; a company older than
 * the seed reads as fresh and gains its row on its first answer. Not a settings change, so no
 * audit entry rides here (`F2-22` names none).
 */
@Injectable()
export class SettingsOnboardingRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  async progress(tenantId: string): Promise<ProgressRow | null> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [row] = await tx
        .select({
          resumeStep: onboardingProgress.resumeStep,
          stepStates: onboardingProgress.stepStates,
          promptPointStates: onboardingProgress.promptPointStates,
        })
        .from(onboardingProgress)
        .where(eq(onboardingProgress.tenantId, tenantId))
        .limit(1);
      return row === undefined ? null : { ...row, resumeStep: stepOf(row.resumeStep) };
    });
  }

  async saveProgress(tenantId: string, row: ProgressRow, now: number): Promise<ProgressRow> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const values = { ...row, updatedAt: new Date(now) };
      await tx
        .insert(onboardingProgress)
        .values({ tenantId, ...values })
        .onConflictDoUpdate({ target: onboardingProgress.tenantId, set: values });
      return row;
    });
  }
}

/** The column is text; a value outside the step list is a corrupted row, said loudly. */
function stepOf(stored: string | null): OnboardingStep | null {
  if (stored === null) return null;
  const step = ONBOARDING_STEPS.find((known) => known === stored);
  if (step === undefined) throw new Error(`onboarding progress at unknown step ${stored}`);
  return step;
}
