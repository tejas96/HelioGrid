/**
 * Proves root.tsx's module augmentation landed.
 *
 * Imported by NOTHING — tsc checks every file under src/, so this runs on typecheck
 * regardless. Listed in knip.jsonc for
 * the same reason.
 *
 * Its own file on purpose: deleting the augmentation in root.tsx then breaks a DIFFERENT
 * file, so the failure cannot be made to disappear by removing one adjacent line.
 *
 * `declare const` carries a type without a value, so it emits no JavaScript and does not trip
 * noUnusedVariables — `satisfies` on the next line is what consumes it. Boot is the anchor
 * because it is the one route present in every session state, so this does not churn as
 * routes come and go.
 */
import './root';

declare const rootParamList: ReactNavigation.RootParamList;

rootParamList satisfies { Boot: undefined };
