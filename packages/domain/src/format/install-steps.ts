import type { PackLabel } from './languages';

/**
 * `M08-41`, owner ruling 2026-11-10 — the standard installation steps a market's projects carry
 * until the design studio derives a work order per design (block 7). The ROW SET is the pack's,
 * the step keys are open-set strings checked against it (`F1-09`), and `M08` seeds and ticks them.
 * Every step expects a photo (`M08-45`).
 */
export interface InstallStepRow {
  readonly step: string;
  readonly label: PackLabel;
}

/** The market's label for a step, or `null` where it declares none (`F1-09`). */
export function installStepLabel(rows: readonly InstallStepRow[], step: string): PackLabel | null {
  return rows.find((row) => row.step === step)?.label ?? null;
}

/** India's steps, in build order: the first tick starts Installation, the last ends it. */
export const IN_INSTALL_STEPS: readonly InstallStepRow[] = [
  {
    step: 'mounting_structure',
    label: { en: 'Mounting structure', hi: 'माउंटिंग स्ट्रक्चर', mr: 'माउंटिंग स्ट्रक्चर' },
  },
  { step: 'panels_fixed', label: { en: 'Panels fixed', hi: 'पैनल लगे', mr: 'पॅनेल बसवले' } },
  {
    step: 'inverter_mounted',
    label: { en: 'Inverter mounted', hi: 'इन्वर्टर लगा', mr: 'इन्व्हर्टर बसवला' },
  },
  {
    step: 'earthing_and_arrester',
    label: {
      en: 'Earthing and lightning arrester',
      hi: 'अर्थिंग और लाइटनिंग अरेस्टर',
      mr: 'अर्थिंग आणि वीज अटकाव यंत्र',
    },
  },
  {
    step: 'ac_dc_wiring',
    label: { en: 'AC and DC wiring', hi: 'AC और DC वायरिंग', mr: 'AC आणि DC वायरिंग' },
  },
  { step: 'final_check', label: { en: 'Final check', hi: 'अंतिम जाँच', mr: 'अंतिम तपासणी' } },
];
