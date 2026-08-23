/**
 * @heliogrid/ui — the V2 design system. ONE package, both platforms: Metro resolves the
 * .native.tsx halves ahead of .tsx, web bundlers only ever see .tsx (docs/17 §2).
 * Every export below is a primitive (docs/17 §4); components compose them and land in
 * src/components/<Name>/ via the assemble step, which owns the marked block at the bottom.
 */

// BEGIN COMPONENT EXPORTS — regenerated wholesale by the assemble step; hand edits between
// the markers are overwritten. The primitives above this block are hand-maintained.
export * from './components/Accordion';
export * from './components/ActionReason';
export * from './components/ActivityStream';
export * from './components/ActorClass';
export * from './components/AllocationMeter';
export * from './components/AppRail';
export * from './components/AppShell';
export * from './components/AudioPlayer';
export * from './components/Avatar';
export * from './components/BandedFigure';
export * from './components/Banner';
export * from './components/Block';
export * from './components/BrandColorField';
export * from './components/Breadcrumb';
export * from './components/Button';
export * from './components/Card';
export * from './components/Charts';
export * from './components/Checkbox';
export * from './components/Checklist';
export * from './components/Chip';
export * from './components/ChipGroup';
export * from './components/CoachMark';
export * from './components/CompareGrid';
export * from './components/ComplianceFloor';
export * from './components/CustomerSurface';
export * from './components/DataTable';
export * from './components/DatePicker';
export * from './components/DateSet';
export * from './components/Derivation';
export * from './components/DetailPanel';
export * from './components/Disclosure';
export * from './components/DocumentPreview';
export * from './components/DrawingSheet';
export * from './components/Dropzone';
export * from './components/EditorSurface';
export * from './components/EmptyState';
export * from './components/FieldModeToggle';
export * from './components/FieldOverride';
export * from './components/FilterBar';
export * from './components/FilterPanel';
export * from './components/FindingList';
export * from './components/IconButton';
export * from './components/Image';
export * from './components/Input';
export * from './components/JobTray';
export * from './components/Kanban';
export * from './components/LanguageSwitcher';
export * from './components/ListRow';
export * from './components/MapSurface';
export * from './components/MarketProvider';
export { useFormat } from './components/MarketProvider';
export * from './components/Menu';
export * from './components/Modal';
export * from './components/MoneySummary';
export * from './components/NamedGap';
export * from './components/NextAction';
export * from './components/NoConnection';
export * from './components/NumberField';
export * from './components/OperationProgress';
export * from './components/OptionCardGroup';
export * from './components/OtpInput';
/* DocumentSection — PagedDocument wins, because its own public prop is typed with the bare name
   (`sections?: DocumentSection<Row>[]`), so a caller cannot annotate that array without it.
   DocumentPreview's section type stays reachable under its exported alias `DocumentSectionInput`,
   which is the type its `sections` prop actually takes. */
export type { DocumentSection } from './components/PagedDocument';
export * from './components/PagedDocument';
export * from './components/PendingAction';
export * from './components/PreviewFrame';
export * from './components/ProgressBar';
export * from './components/Provenance';
export * from './components/QRCode';
export * from './components/Radio';
export * from './components/RangeField';
export * from './components/ReorderList';
export * from './components/RichText';
export * from './components/ScopeNote';
export * from './components/SearchField';
export * from './components/SegmentedControl';
export * from './components/Select';
export * from './components/Sheet';
export * from './components/Slider';
export * from './components/SourceDocument';
export * from './components/StatCard';
export * from './components/StatusChip';
export * from './components/Stepper';
export * from './components/Switch';
export * from './components/Tabs';
export * from './components/TenantHeader';
export * from './components/Textarea';
export * from './components/TimeField';
export * from './components/Timeline';
export * from './components/Toast';
export * from './components/ToastHost';
export * from './components/Tooltip';
export * from './components/Transcript';
export * from './components/UnavailableNote';
export * from './components/UsageMeter';
export * from './components/ValueSource';
export * from './components/VersionDiff';
export * from './components/Wordmark';
export type {
  BoxProps,
  Space,
  StackAlign,
  StackDirection,
  StackJustify,
  StackProps,
} from './primitives/Box';
export { Box, Stack } from './primitives/Box';
export type { FieldProps } from './primitives/Field';
export { Field } from './primitives/Field';
export type { IconProps, IconSize } from './primitives/Icon';
export { ICON_SIZE, Icon } from './primitives/Icon';
export type { PortalHostProps, PortalProps } from './primitives/Portal';
export { Portal, PortalHost } from './primitives/Portal';
export type { PressableProps } from './primitives/Pressable';
export { MIN_TOUCH_TARGET, Pressable } from './primitives/Pressable';
export type { StatusMarkProps, StatusTone } from './primitives/StatusMark';
export { STATUS_GLYPH, StatusMark } from './primitives/StatusMark';
export type {
  Density,
  Elevation,
  SurfaceBackground,
  SurfaceProps,
  SurfaceRadius,
} from './primitives/Surface';
export { Surface } from './primitives/Surface';
export type { TextAlign, TextColor, TextProps, TextVariant } from './primitives/Text';
export { Text } from './primitives/Text';
export * from './utils/color-contrast';
/* MarketFormat / IN_FORMAT / useFormat were declared TWICE — once here and once in the
   calendar's own `DatePicker/market-format.ts` — which made a bare `export *` ambiguous (TS2308)
   and had to be resolved by hand. The second declaration is GONE: `utils/format` is the one
   contract and `MarketProvider` the one provider, so the collision it settled no longer exists.
   Named re-exports are kept because they say who owns the contract. */
export type { MarketFormat } from './utils/format';
export * from './utils/format';
export { IN_FORMAT } from './utils/format';
export * from './utils/market-pack';
export * from './utils/money-lines';
export * from './utils/page-size';
export * from './utils/print-scope';
export * from './utils/qr-encode';
export * from './utils/qr-encode-blocks';
// END COMPONENT EXPORTS
