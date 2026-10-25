import type { ItemFormSetup } from './CatalogItemForm.story';

/** The add sheet's built frames as the spec mounts them (`SCR-M01-16`, RFC §6 *Frames*). */
export const ALMM_REFERENCE = 'List-I, S. No. 38';
const ALMM_ON = {
  ALMM: { on: true, reference: ALMM_REFERENCE },
  DCR: { on: true, reference: '' },
};

/** The panel the board types (`SAATVIK`), its optional values left blank. */
const SAATVIK = {
  ...{ watt: 575, technology: 'mono_perc', lengthMm: 2278, widthMm: 1134 },
  ...{ vocV: 51.6, vmpV: 43.4, iscA: 14, impA: 13.25, tempCoeffVocPct: -0.27 },
};
const PANEL: ItemFormSetup = {
  ...{ kind: 'panel', caller: 'picker', brand: 'Saatvik', model: 'SGP-575-BAA-HC' },
  ...{ spec: SAATVIK, schemes: ALMM_ON, price: '15650' },
};

/** Every built frame, by its board id (§6 *Frames*). */
export const FRAMES = {
  'm16-f': PANEL,
  'm16-g': {
    ...{ kind: 'inverter', caller: 'picker', brand: 'Solis', model: 'S6-GR1P5K-M', price: '31900' },
    spec: {
      ...{ acKw: 5, phases: 1, maxDcV: 600, efficiencyPct: 97.5, 'mppt.count': 2 },
      ...{ 'mppt.stringsPerMppt': 1, 'mppt.maxCurrentA': 16, 'mppt.minV': 80, 'mppt.maxV': 550 },
      warrantyYears: 5,
    },
  },
  'm16-h': {
    ...{ kind: 'battery', caller: 'settings', brand: 'Exide', model: 'Solar LFP 5.1 kWh' },
    price: '98500',
    spec: {
      ...{ usableKwh: 5.1, nominalV: 51.2, chemistry: 'lfp', powerKw: 2.5, cycleLife: 6000 },
      ...{ weightKg: 52, widthMm: 480, depthMm: 200, heightMm: 640, warrantyYears: 10 },
    },
  },
  'micro-inverter': {
    ...{ kind: 'micro_inverter', caller: 'settings', brand: 'Enphase', model: 'IQ8M' },
    spec: { ratedAcW: 330 },
  },
  optimiser: {
    ...{ kind: 'optimiser', caller: 'settings', brand: 'SolarEdge', model: 'S440' },
    spec: { ratedInputW: 440 },
  },
  's16-c': { kind: 'panel', caller: 'settings' },
  's16-a': { kind: 'panel', caller: 'picker', loading: true },
  's16-d': { ...PANEL, returned: true },
  refused: { ...PANEL, spec: { ...SAATVIK, lengthMm: 1000 }, judged: true },
  'd16-c': {
    ...{ kind: 'panel', caller: 'picker', brand: 'Vikram Solar', model: 'Somera 540' },
    copiedFrom: 'Vikram Solar Somera 540',
    spec: {
      ...{ ...SAATVIK, watt: 540, lengthMm: 2279, vocV: 49.7, vmpV: 41.9, iscA: 13.8 },
      ...{ impA: 12.9, tempCoeffVocPct: -0.28, tempCoeffPmaxPct: -0.36, bifacialityPct: 70 },
      ...{ warrantyYears: 25, weightKg: 28.6 },
    },
  },
  'd16-d': { ...PANEL, priced: false, spreadsheet: false, price: '' },
  's16-i': { ...PANEL, confirmingDiscard: true },
} as const satisfies Record<string, ItemFormSetup>;
