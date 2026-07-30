/**
 * Parity assertion — the WEB implementation against the shared contract (@heliogrid/ui-api).
 *
 * Its own file, not a block in index.ts: the barrel's responsibility is the public surface,
 * this file's is proving that surface matches the other platform. Nothing imports it — tsc
 * checks every file under src/, so the assertion runs on `pnpm turbo typecheck` regardless.
 *
 * `declare const` carries a type without a value, so excess-property checking does not apply
 * and web keeps its DOM-inherited props. What `satisfies` enforces is the direction that
 * matters: every contract prop present, at the contract's type and optionality. If this stops
 * compiling, THIS platform drifted — fix the component's props, not this file.
 *
 * Scope is stated ONCE, in @heliogrid/ui-api's header — deliberately no numeral here. Restating
 * it is how this comment came to advertise "99 props" and "seven open drifts awaiting an owner
 * ruling" for a contract that had moved on, and how the count then drifted again (117 in three
 * files, 118 in the contract). One place, or it rots.
 */
import type { ComponentApiSurface } from '@heliogrid/ui-api';
import type { ComponentProps } from 'react';
import type * as UI from './index';

declare const webComponentApi: {
  Avatar: ComponentProps<typeof UI.Avatar>;
  AvatarGroup: ComponentProps<typeof UI.AvatarGroup>;
  Badge: ComponentProps<typeof UI.Badge>;
  BloomLayer: ComponentProps<typeof UI.BloomLayer>;
  Button: ComponentProps<typeof UI.Button>;
  Card: ComponentProps<typeof UI.Card>;
  Checkbox: ComponentProps<typeof UI.Checkbox>;
  Chip: ComponentProps<typeof UI.Chip>;
  EmptyState: ComponentProps<typeof UI.EmptyState>;
  IconButton: ComponentProps<typeof UI.IconButton>;
  IconCircle: ComponentProps<typeof UI.IconCircle>;
  Input: ComponentProps<typeof UI.Input>;
  ListRow: ComponentProps<typeof UI.ListRow>;
  OfflineBanner: ComponentProps<typeof UI.OfflineBanner>;
  OtpInput: ComponentProps<typeof UI.OtpInput>;
  ProgressBar: ComponentProps<typeof UI.ProgressBar>;
  Radio: ComponentProps<typeof UI.Radio>;
  RadioCard: ComponentProps<typeof UI.RadioCard>;
  SegmentedControl: ComponentProps<typeof UI.SegmentedControl>;
  Spinner: ComponentProps<typeof UI.Spinner>;
  StatCard: ComponentProps<typeof UI.StatCard>;
  StatusChip: ComponentProps<typeof UI.StatusChip>;
  StepIndicator: ComponentProps<typeof UI.StepIndicator>;
  Switch: ComponentProps<typeof UI.Switch>;
  Tabs: ComponentProps<typeof UI.Tabs>;
  TextLink: ComponentProps<typeof UI.TextLink>;
  Toast: ComponentProps<typeof UI.Toast>;
  Wordmark: ComponentProps<typeof UI.Wordmark>;
};

webComponentApi satisfies ComponentApiSurface;

/**
 * The reverse direction, and it is not redundant.
 *
 * `satisfies ComponentApiSurface` above only proves the implementation is not LOOSER than the
 * contract. It stays silent when a platform is STRICTER — narrowing a union (RN dropping
 * `variant="destructive"`) and dropping an optional prop (`Chip.dot`) both passed it. Both are
 * real drift: a call site valid on one platform then fails on the other.
 *
 * Two checks close that gap:
 *   MissingContractProps  — contract keys absent from the implementation, surfaced as a type
 *                           error that NAMES them ('dot' is not assignable to never).
 *   contractShape satisfies … — the implementation must accept everything the contract allows,
 *                           so a narrowed union fails.
 */
type Impl = typeof webComponentApi;

type MissingContractProps = {
  [K in keyof ComponentApiSurface]: Exclude<keyof ComponentApiSurface[K], keyof Impl[K]>;
}[keyof ComponentApiSurface];

declare const missingContractProps: MissingContractProps;
missingContractProps satisfies never;

declare const contractShape: ComponentApiSurface;
contractShape satisfies {
  [K in keyof ComponentApiSurface]: Pick<
    Impl[K],
    Extract<keyof ComponentApiSurface[K], keyof Impl[K]>
  >;
};

/**
 * The third direction: the CONTRACT must cover every component, not just every prop.
 *
 * Both assertions above iterate `keyof ComponentApiSurface`, so they say nothing about a
 * component missing from it. A 29th component exported here with no RN mirror — precisely the
 * Law 7 lockstep failure this package exists to stop — passed every gate, because the contract
 * and the two `declare const` blocks were three hand-maintained lists of the same 28 names and
 * nothing compared them to the barrel.
 *
 * `keyof typeof UI` is exactly the barrel's VALUE exports (types erase), so adding a component
 * to index.ts without adding it to ComponentApiSurface fails HERE, naming it. A non-component
 * value export would also fail — correctly: it is a deliberate decision, so record it in the
 * Exclude below with a reason rather than widening the contract.
 */
type UncoveredComponents = Exclude<keyof typeof UI, keyof ComponentApiSurface>;
declare const uncoveredComponents: UncoveredComponents;
uncoveredComponents satisfies never;
