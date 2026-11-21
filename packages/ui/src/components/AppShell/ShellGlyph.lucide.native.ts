/*
 * The phone's Lucide: each icon `SHELL_GLYPHS` names, from its own module — the package's root
 * re-exports all of its icons, and Metro, which does not shake, would bundle every one. Only this
 * pair of files imports an icon package (biome.json). It is `.native.ts`, as its web twin is `.ts`:
 * Metro tries every platform form of one extension before the next, so a `.native.tsx` beside a
 * `.ts` is never picked.
 */
import type { LucideIcon, LucideIconData, LucideProps } from 'lucide-react-native';
import { type ComponentType, createElement, forwardRef } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type { LucideIcon } from 'lucide-react-native';
export { default as ArchiveIcon } from 'lucide-react-native/icons/archive';
export { default as ArrowDownIcon } from 'lucide-react-native/icons/arrow-down';
export { default as ArrowRightIcon } from 'lucide-react-native/icons/arrow-right';
export { default as ArrowUpDownIcon } from 'lucide-react-native/icons/arrow-up-down';
export { default as ArrowUpRightIcon } from 'lucide-react-native/icons/arrow-up-right';
export { default as BanIcon } from 'lucide-react-native/icons/ban';
export { default as BatteryIcon } from 'lucide-react-native/icons/battery';
export { default as BellIcon } from 'lucide-react-native/icons/bell';
export { default as BoldIcon } from 'lucide-react-native/icons/bold';
export { default as BoxIcon } from 'lucide-react-native/icons/box';
export { default as BriefcaseIcon } from 'lucide-react-native/icons/briefcase';
export { default as BuildingIcon } from 'lucide-react-native/icons/building';
export { default as CalendarIcon } from 'lucide-react-native/icons/calendar';
export { default as CalendarCheckIcon } from 'lucide-react-native/icons/calendar-check';
export { default as CalendarClockIcon } from 'lucide-react-native/icons/calendar-clock';
export { default as CameraIcon } from 'lucide-react-native/icons/camera';
export { default as ChartColumnIcon } from 'lucide-react-native/icons/chart-column';
export { default as CheckIcon } from 'lucide-react-native/icons/check';
export { default as CheckCheckIcon } from 'lucide-react-native/icons/check-check';
export { default as ChevronDownIcon } from 'lucide-react-native/icons/chevron-down';
export { default as ChevronLeftIcon } from 'lucide-react-native/icons/chevron-left';
export { default as ChevronRightIcon } from 'lucide-react-native/icons/chevron-right';
export { default as ChevronUpIcon } from 'lucide-react-native/icons/chevron-up';
export { default as ChevronsUpDownIcon } from 'lucide-react-native/icons/chevrons-up-down';
export { default as CircleIcon } from 'lucide-react-native/icons/circle';
export { default as CircleAlertIcon } from 'lucide-react-native/icons/circle-alert';
export { default as CircleCheckIcon } from 'lucide-react-native/icons/circle-check';
export { default as CircleMinusIcon } from 'lucide-react-native/icons/circle-minus';
export { default as CirclePlusIcon } from 'lucide-react-native/icons/circle-plus';
export { default as ClipboardIcon } from 'lucide-react-native/icons/clipboard';
export { default as ClockIcon } from 'lucide-react-native/icons/clock';
export { default as CloudOffIcon } from 'lucide-react-native/icons/cloud-off';
export { default as Columns2Icon } from 'lucide-react-native/icons/columns-2';
export { default as CommandIcon } from 'lucide-react-native/icons/command';
export { default as CreditCardIcon } from 'lucide-react-native/icons/credit-card';
export { default as DiamondIcon } from 'lucide-react-native/icons/diamond';
export { default as DotIcon } from 'lucide-react-native/icons/dot';
export { default as DownloadIcon } from 'lucide-react-native/icons/download';
export { default as DraftingCompassIcon } from 'lucide-react-native/icons/drafting-compass';
export { default as EllipsisIcon } from 'lucide-react-native/icons/ellipsis';
export { default as ExpandIcon } from 'lucide-react-native/icons/expand';
export { default as EyeIcon } from 'lucide-react-native/icons/eye';
export { default as EyeOffIcon } from 'lucide-react-native/icons/eye-off';
export { default as FileIcon } from 'lucide-react-native/icons/file';
export { default as FileTextIcon } from 'lucide-react-native/icons/file-text';
export { default as FlagIcon } from 'lucide-react-native/icons/flag';
export { default as GaugeIcon } from 'lucide-react-native/icons/gauge';
export { default as GlobeIcon } from 'lucide-react-native/icons/globe';
export { default as HeadingIcon } from 'lucide-react-native/icons/heading';
export { default as HeadsetIcon } from 'lucide-react-native/icons/headset';
export { default as HouseIcon } from 'lucide-react-native/icons/house';
export { default as ImageIcon } from 'lucide-react-native/icons/image';
export { default as ImageOffIcon } from 'lucide-react-native/icons/image-off';
export { default as IndianRupeeIcon } from 'lucide-react-native/icons/indian-rupee';
export { default as InfoIcon } from 'lucide-react-native/icons/info';
export { default as ItalicIcon } from 'lucide-react-native/icons/italic';
export { default as KeyIcon } from 'lucide-react-native/icons/key';
export { default as LayersIcon } from 'lucide-react-native/icons/layers';
export { default as LayoutGridIcon } from 'lucide-react-native/icons/layout-grid';
export { default as LinkIcon } from 'lucide-react-native/icons/link';
export { default as ListIcon } from 'lucide-react-native/icons/list';
export { default as ListOrderedIcon } from 'lucide-react-native/icons/list-ordered';
export { default as LocateFixedIcon } from 'lucide-react-native/icons/locate-fixed';
export { default as LockIcon } from 'lucide-react-native/icons/lock';
export { default as LogOutIcon } from 'lucide-react-native/icons/log-out';
export { default as MapIcon } from 'lucide-react-native/icons/map';
export { default as MapPinIcon } from 'lucide-react-native/icons/map-pin';
export { default as MapPinCheckIcon } from 'lucide-react-native/icons/map-pin-check';
export { default as MegaphoneIcon } from 'lucide-react-native/icons/megaphone';
export { default as MessageCircleIcon } from 'lucide-react-native/icons/message-circle';
export { default as MinusIcon } from 'lucide-react-native/icons/minus';
export { default as MonitorIcon } from 'lucide-react-native/icons/monitor';
export { default as MoonIcon } from 'lucide-react-native/icons/moon';
export { default as MoveIcon } from 'lucide-react-native/icons/move';
export { default as Navigation2Icon } from 'lucide-react-native/icons/navigation-2';
export { default as PackageIcon } from 'lucide-react-native/icons/package';
export { default as PaletteIcon } from 'lucide-react-native/icons/palette';
export { default as PanelLeftIcon } from 'lucide-react-native/icons/panel-left';
export { default as PauseIcon } from 'lucide-react-native/icons/pause';
export { default as PencilIcon } from 'lucide-react-native/icons/pencil';
export { default as PhoneIcon } from 'lucide-react-native/icons/phone';
export { default as PlusIcon } from 'lucide-react-native/icons/plus';
export { default as Redo2Icon } from 'lucide-react-native/icons/redo-2';
export { default as RotateCwIcon } from 'lucide-react-native/icons/rotate-cw';
export { default as RulerIcon } from 'lucide-react-native/icons/ruler';
export { default as ScaleIcon } from 'lucide-react-native/icons/scale';
export { default as SearchIcon } from 'lucide-react-native/icons/search';
export { default as SendIcon } from 'lucide-react-native/icons/send';
export { default as SettingsIcon } from 'lucide-react-native/icons/settings';
export { default as SheetIcon } from 'lucide-react-native/icons/sheet';
export { default as ShieldIcon } from 'lucide-react-native/icons/shield';
export { default as ShieldCheckIcon } from 'lucide-react-native/icons/shield-check';
export { default as ShoppingCartIcon } from 'lucide-react-native/icons/shopping-cart';
export { default as SlidersHorizontalIcon } from 'lucide-react-native/icons/sliders-horizontal';
export { default as SolarPanelIcon } from 'lucide-react-native/icons/solar-panel';
export { default as SparklesIcon } from 'lucide-react-native/icons/sparkles';
export { default as SquareKanbanIcon } from 'lucide-react-native/icons/square-kanban';
export { default as StarIcon } from 'lucide-react-native/icons/star';
export { default as StickyNoteIcon } from 'lucide-react-native/icons/sticky-note';
export { default as SunIcon } from 'lucide-react-native/icons/sun';
export { default as TextAlignStartIcon } from 'lucide-react-native/icons/text-align-start';
export { default as TrashIcon } from 'lucide-react-native/icons/trash';
export { default as TrendingDownIcon } from 'lucide-react-native/icons/trending-down';
export { default as TrendingUpIcon } from 'lucide-react-native/icons/trending-up';
export { default as TriangleAlertIcon } from 'lucide-react-native/icons/triangle-alert';
export { default as TruckIcon } from 'lucide-react-native/icons/truck';
export { default as Undo2Icon } from 'lucide-react-native/icons/undo-2';
export { default as UnlinkIcon } from 'lucide-react-native/icons/unlink';
export { default as UploadIcon } from 'lucide-react-native/icons/upload';
export { default as UserIcon } from 'lucide-react-native/icons/user';
export { default as UserMinusIcon } from 'lucide-react-native/icons/user-minus';
export { default as UserPlusIcon } from 'lucide-react-native/icons/user-plus';
export { default as UsersIcon } from 'lucide-react-native/icons/users';
export { default as UsersRoundIcon } from 'lucide-react-native/icons/users-round';
export { default as WalletIcon } from 'lucide-react-native/icons/wallet';
export { default as WaypointsIcon } from 'lucide-react-native/icons/waypoints';
export { default as WrenchIcon } from 'lucide-react-native/icons/wrench';
export { default as XIcon } from 'lucide-react-native/icons/x';
export { default as ZapIcon } from 'lucide-react-native/icons/zap';

const MARKS: Record<string, ComponentType<object>> = { circle: Circle, path: Path, rect: Rect };

/**
 * Draws a node list the way the package's own icons draw theirs, for the two `SHELL_GLYPHS` draws
 * itself: the package's factory sits only behind the root this file avoids.
 */
export function createLucideIcon({ name, node }: LucideIconData): LucideIcon {
  const Glyph = forwardRef<Svg, LucideProps>(
    ({ size = 24, color = 'currentColor', strokeWidth = 2, ...rest }, ref) =>
      createElement(
        Svg,
        {
          ref,
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: color,
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          ...rest,
        },
        node.map(([tag, attrs]) => createElement(MARKS[tag] ?? Path, attrs)),
      ),
  );
  Glyph.displayName = name;
  return Glyph as LucideIcon;
}
