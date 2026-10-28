import { describe, expect, it } from 'vitest';
import { packLabel } from '../../src/format/languages';
import { IN_FORMATS } from '../../src/format/pack';
import {
  blockerPartyLabel,
  isSkippableStage,
  paymentModeLabel,
  stageLabel,
} from '../../src/format/vocabulary';
import { PROJECT_STAGE_CHAIN } from '../../src/projects/stages';
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

  it('keeps DISCOM in every language and translates the rest of its stage — only an operator name is never translated (F3-08)', () => {
    const stage = stageLabel(IN, 'utility_inspection');
    const party = blockerPartyLabel(IN, 'utility');
    expect(stage && [packLabel(stage, 'hi'), packLabel(stage, 'mr')]).toEqual([
      'DISCOM निरीक्षण',
      'DISCOM तपासणी',
    ]);
    expect(party && packLabel(party, 'hi')).toBe('DISCOM');
  });

  it('labels every stage of the chain a tranche can fall due on (SCR-M01-20)', () => {
    for (const stage of PROJECT_STAGE_CHAIN) {
      expect(stageLabel(IN, stage), `no label for ${stage}`).not.toBeNull();
    }
  });

  it('labels a stage it now names in Hindi and Marathi', () => {
    const label = stageLabel(IN, 'material_ordered');
    expect(label && [packLabel(label, 'hi'), packLabel(label, 'mr')]).toEqual([
      'सामान का ऑर्डर',
      'साहित्याची ऑर्डर',
    ]);
  });

  it('returns null for a stage the market never declared, rather than guessing (F1-09)', () => {
    expect(stageLabel(IN, 'cancelled')).toBeNull();
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
