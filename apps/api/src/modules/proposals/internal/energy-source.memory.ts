import type { EnergyAnswer, EnergySourceOfRecord } from '@heliogrid/contracts';
import type { Coordinate } from '@heliogrid/domain';

/**
 * The energy source under test and on a machine with no network: it answers what it was told to,
 * and until told it does not answer — exactly a source that is down — so a suite never reaches a
 * third party and the fallback is the default path it proves.
 */
export class MemoryEnergySource implements EnergySourceOfRecord {
  private answer: EnergyAnswer | null = null;
  /** Every point asked, in order: a proof that a cached point is not asked again. */
  readonly asked: Coordinate[] = [];

  answerWith(answer: EnergyAnswer | null): void {
    this.answer = answer;
  }

  async monthlyYield(point: Coordinate): Promise<EnergyAnswer> {
    this.asked.push(point);
    if (this.answer === null) throw new Error('the energy source did not answer');
    return this.answer;
  }
}
