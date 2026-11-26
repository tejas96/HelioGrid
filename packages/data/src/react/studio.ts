/**
 * The design studio's canvas hook, on its own entry (`T-M05-002`, part e): it works a roof's place
 * out with the studio's roof kernel (`@heliogrid/domain/studio-kernel`), which the phone app never
 * bundles — the phone shows the studio in a web view. Its view model's types stay on `./react`.
 */
export { useRoofDresses } from './use-roof-dresses';
export { useStudioScreen } from './use-studio-screen';
