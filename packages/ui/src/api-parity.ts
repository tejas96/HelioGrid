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
 * Scope is the 99 props both platforms already agreed on; @heliogrid/ui-api's header records
 * what sits outside the contract and the seven open drifts awaiting an owner ruling.
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
