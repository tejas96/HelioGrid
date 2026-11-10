import type { StageMeterStage } from './StageMeter.types';

/**
 * Each stage's share of the bar, as a fraction of every lead counted; with none counted every
 * stage takes an even share, so an empty pipeline still draws its seven places.
 */
export function stageSharesOf(stages: readonly StageMeterStage[]): readonly number[] {
  const total = stages.reduce((sum, one) => sum + one.count, 0);
  return stages.map((one) => (total === 0 ? 1 / stages.length : one.count / total));
}
