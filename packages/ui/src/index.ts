/**
 * The 21-component _ds public API (docs/10 §6) — import ONLY from this index.
 * Prop enums come from design/ds-source/_adherence.oxlintrc.json; visual truth from
 * the _ds_bundle reference implementations; every value is a token var.
 */

export { Avatar, AvatarGroup, type AvatarGroupProps, type AvatarProps } from './data/Avatar';
export { Card, type CardProps, IconCircle, type IconCircleProps } from './data/Card';
export { Badge, type BadgeProps, Chip, type ChipProps } from './data/Chip';
export { ListRow, type ListRowProps } from './data/ListRow';
export { StatCard, type StatCardProps } from './data/StatCard';
export { StatusChip, type StatusChipProps, type WorkflowStatus } from './data/StatusChip';
export { EmptyState, type EmptyStateProps } from './feedback/EmptyState';
export { OfflineBanner, type OfflineBannerProps } from './feedback/OfflineBanner';
export { ProgressBar, type ProgressBarProps } from './feedback/ProgressBar';
export { Toast, type ToastProps } from './feedback/Toast';
export { Button, type ButtonProps } from './forms/Button';
export { Checkbox, type CheckboxProps } from './forms/Checkbox';
export { IconButton, type IconButtonProps } from './forms/IconButton';
export { Input, type InputProps } from './forms/Input';
export { Radio, type RadioProps } from './forms/Radio';
export { Switch, type SwitchProps } from './forms/Switch';

export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './navigation/SegmentedControl';
export { type TabItem, Tabs, type TabsProps } from './navigation/Tabs';
