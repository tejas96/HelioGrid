/**
 * The design studio's canvas hook, on its own entry (`T-M05-002`, part e): it works a roof's place
 * out with the studio's roof kernel (`@heliogrid/domain/studio-kernel`), which the phone app never
 * bundles — the phone shows the studio in a web view. Its view model's types stay on `./react`.
 */

export {
  type DrawnOnPiece,
  type SiteFitReader,
  type SiteLineUpReader,
  SiteReaderProvider,
  type SiteReaders,
  type SiteRoofReader,
  type SiteScanReader,
} from './site-readers';
export {
  type GroundOutline,
  type ShadeCut,
  type SunlightPiece,
  shadeCasterOf,
  shadeCatcherOf,
  sunlightPiecesOf,
} from './site-shade-cells';
export { useRoofDresses } from './use-roof-dresses';
export type { SiteSunlightReader } from './use-site-sunlight';
export { useStudioScreen } from './use-studio-screen';
