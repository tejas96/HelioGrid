/**
 * @heliogrid/ui-api — the component API contract. TYPES ONLY, no runtime code.
 *
 * `packages/ui` (web, DOM + CSS) and `apps/mobile/src/ui` (RN, StyleSheet) render differently
 * by necessity — that split is legitimate and stays (ADR-0011: bare RN, pixel fidelity;
 * react-native-web/Tamagui were rejected). What must NOT differ is the prop surface. Before
 * this package, parity was checked by a human comparing two galleries, and it had already
 * failed once in production: `StatusChip.label` was optional with an English fallback on web
 * and required on RN, so callers who omitted it shipped untranslated English past Lingui.
 *
 * Each implementation index asserts `satisfies ComponentApiSurface`, so a platform that drifts
 * fails ITS OWN typecheck, naming the component.
 *
 * Those assertions all iterate `keyof ComponentApiSurface`, so they cannot see a prop that is
 * in NEITHER this contract nor the two `declare const` blocks. `pnpm check:ui-parity` closes
 * that: it reads each platform's AUTHORED props straight from the source and fails on any
 * declared by both but missing here. It found `AvatarGroup.people` — see data.ts.
 *
 * WHAT THIS CONTRACT COVERS — read this before assuming a green build means full parity.
 * It declares the 118 props (of 172 across 28 components) that both platforms agree
 * on: same name, equivalent type, same optionality. Two categories remain deliberately absent:
 *
 *   1. Platform-owned props. Web inherits DOM attributes (`type`, `form`, `aria-*`) and RN has
 *      `hitSlop`/`ViewStyle`. `className?: string` and `style?: ViewStyle` are not the same
 *      prop wearing two hats. This is the shared surface, not the union.
 *   2. Platform-shaped handlers. Web inherits `MouseEventHandler<HTMLButtonElement>` where RN
 *      declares `() => void`; likewise `ChangeEventHandler` vs `(text: string) => void`.
 *      Neither is assignable to the other, so no single declaration can hold both without
 *      changing the components.
 *   3. (RESOLVED 2026-07-30) Ten copy props were `ReactNode` on web and `string` on RN. They
 *      are now `string` on both and IN the contract. Web needed a node type only so Lingui
 *      `<Trans>` elements could be passed; those four call sites now use `i18n._()` with the
 *      identical msgid, so the catalogues are byte-unchanged. No structural markup was ever
 *      passed to them — the capability web appeared to have was never used.
 *
 * SEVEN parity defects were found while deriving this, all the same class as the StatusChip
 * incident and none caught by the galleries. All SEVEN WERE FIXED on 2026-07-30 rather than
 * excluded, and the props they governed are now IN the contract:
 *
 *   Avatar.name              optional web (defaulted to '') → required both. It is the
 *                            accessible name; the default shipped alt="" on a person's avatar.
 *   EmptyState.icon          optional RN → required both (RN drew an empty bloom circle).
 *   Tabs.onChange            optional web → required both. With `value` required the parent
 *   SegmentedControl.onChange   owns state, so a control that cannot report a change is
 *   RadioCard.onChange          broken, not permissive.
 *   TabItem / SegmentedOption / RadioCardOption
 *                            declared separately per platform and drifted (`label` was
 *                            ReactNode on web, string on RN). Now ONE definition in common.ts.
 *
 * In every case RN held the stricter, correct contract and web was the lax side. No call site
 * had to change: each was already passing the prop and already passing a string.
 */
export type { ChipTone, Density } from './common.js';
export type {
  BloomLayerApi,
  OtpInputApi,
  RadioCardApi,
  SpinnerApi,
  StepIndicatorApi,
  TextLinkApi,
  WordmarkApi,
} from './composites.js';
export type {
  AvatarApi,
  AvatarGroupApi,
  BadgeApi,
  CardApi,
  ChipApi,
  IconCircleApi,
  ListRowApi,
  StatCardApi,
  StatusChipApi,
} from './data.js';
export type {
  EmptyStateApi,
  OfflineBannerApi,
  ProgressBarApi,
  ToastApi,
  ToastTone,
} from './feedback.js';
export type {
  ButtonApi,
  CheckboxApi,
  IconButtonApi,
  InputApi,
  RadioApi,
  SwitchApi,
} from './forms.js';
export type { SegmentedControlApi, TabsApi } from './navigation.js';

import type {
  BloomLayerApi,
  OtpInputApi,
  RadioCardApi,
  SpinnerApi,
  StepIndicatorApi,
  TextLinkApi,
  WordmarkApi,
} from './composites.js';
import type {
  AvatarApi,
  AvatarGroupApi,
  BadgeApi,
  CardApi,
  ChipApi,
  IconCircleApi,
  ListRowApi,
  StatCardApi,
  StatusChipApi,
} from './data.js';
import type { EmptyStateApi, OfflineBannerApi, ProgressBarApi, ToastApi } from './feedback.js';
import type {
  ButtonApi,
  CheckboxApi,
  IconButtonApi,
  InputApi,
  RadioApi,
  SwitchApi,
} from './forms.js';
import type { SegmentedControlApi, TabsApi } from './navigation.js';

/**
 * The shape every implementation index must satisfy.
 *
 * Assert it with a declared const, never an object literal:
 *
 *     declare const _impl: { Button: ComponentProps<typeof Button>; … };
 *     _impl satisfies ComponentApiSurface;
 *
 * A `declare const` carries a type without a value, so excess-property checking does not
 * apply and each platform keeps its own extra props. What `satisfies` still enforces is the
 * direction that matters: every contract prop must be present, at the contract's type, with
 * the contract's optionality. An implementation that makes a required prop optional stops
 * compiling — which is precisely what the galleries could not detect.
 */
export interface ComponentApiSurface {
  Avatar: AvatarApi;
  AvatarGroup: AvatarGroupApi;
  Badge: BadgeApi;
  BloomLayer: BloomLayerApi;
  Button: ButtonApi;
  Card: CardApi;
  Checkbox: CheckboxApi;
  Chip: ChipApi;
  EmptyState: EmptyStateApi;
  IconButton: IconButtonApi;
  IconCircle: IconCircleApi;
  Input: InputApi;
  ListRow: ListRowApi;
  OfflineBanner: OfflineBannerApi;
  OtpInput: OtpInputApi;
  ProgressBar: ProgressBarApi;
  Radio: RadioApi;
  RadioCard: RadioCardApi;
  SegmentedControl: SegmentedControlApi;
  Spinner: SpinnerApi;
  StatCard: StatCardApi;
  StatusChip: StatusChipApi;
  StepIndicator: StepIndicatorApi;
  Switch: SwitchApi;
  Tabs: TabsApi;
  TextLink: TextLinkApi;
  Toast: ToastApi;
  Wordmark: WordmarkApi;
}
