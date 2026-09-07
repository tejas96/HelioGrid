import { describe, expect, it } from 'vitest';
import { packLabel } from '../../src/format/languages';
import { IN_FORMATS } from '../../src/format/pack';
import {
  blockerPartyLabel,
  isSkippableStage,
  paymentModeLabel,
  stageLabel,
} from '../../src/format/vocabulary';
import { IN_PAYMENT_RAILS } from '../../src/rails/pack';

const IN = IN_FORMATS.vocabulary;

describe('stage and blocker labels — what a user reads for a machine value (F1-51)', () => {
  it('labels utility_inspection "DISCOM inspection"', () => {
    const label = stageLabel(IN, 'utility_inspection');
    expect(label && packLabel(label, 'en')).toBe('DISCOM inspection');
  });

  it('labels incentive_claimed "Subsidy claimed"', () => {
    const label = stageLabel(IN, 'incentive_claimed');
    expect(label && packLabel(label, 'en')).toBe('Subsidy claimed');
  });

  it('labels the utility blocker party "DISCOM"', () => {
    const label = blockerPartyLabel(IN, 'utility');
    expect(label && packLabel(label, 'en')).toBe('DISCOM');
  });

  it('reads DISCOM identically in Marathi — an operator name is never translated (F3-08)', () => {
    const stage = stageLabel(IN, 'utility_inspection');
    const party = blockerPartyLabel(IN, 'utility');
    expect(stage && packLabel(stage, 'mr')).toBe('DISCOM inspection');
    expect(party && packLabel(party, 'hi')).toBe('DISCOM');
  });

  it('returns null for a stage the market never declared, rather than guessing (F1-09)', () => {
    expect(stageLabel(IN, 'commissioned')).toBeNull();
    expect(blockerPartyLabel(IN, 'customer')).toBeNull();
  });
});

describe('skippable stages (F1-51, per F1-35)', () => {
  it('names incentive_claimed and nothing else', () => {
    expect(IN.skippableStages).toEqual(['incentive_claimed']);
  });

  it('does not let a stage the market never named be skipped', () => {
    expect(isSkippableStage(IN, 'incentive_claimed')).toBe(true);
    expect(isSkippableStage(IN, 'utility_inspection')).toBe(false);
  });
});

describe('payment-mode display names (F1-22, §F1.2 assignment)', () => {
  it('names every mode the rails key declares — no mode renders as its machine value', () => {
    for (const { mode } of IN_PAYMENT_RAILS.paymentModes) {
      expect(paymentModeLabel(IN, mode), `no display name for ${mode}`).not.toBeNull();
    }
  });

  it('returns null for a mode this market does not collect (F1-09)', () => {
    expect(paymentModeLabel(IN, 'sepa_direct_debit')).toBeNull();
  });
});
