/**
 * What part e adds to the studio's vocabulary (`T-M05-002`, many roofs), for every device: what a
 * roof is and what it is made of, how it meets the others, what it is called, where it stands, and
 * the 3D model's shape. The geometry behind them is the kernel's (`../studio-kernel.ts`).
 */
export * from './roof-height-pull';
export * from './roof-kind';
export { type KindLine, kindLineOf } from './roof-kind-line';
export {
  type RoofFacts,
  roofFactsOf,
  roofStartHeightM,
  roofTopsM,
} from './roof-levels';
export * from './roof-list';
export * from './roof-material';
export type { MaterialPick } from './roof-material-set';
export * from './roof-meeting';
export { type RoofName, roofNameOf, roofNumber } from './roof-names';
export * from './roof-parts';
export * from './roof-scene';
export { STICKS_OUT_MIN_M, sticksOutM } from './roof-sticks-out';
export * from './roof-top-marks';
export * from './roofs-panel';
