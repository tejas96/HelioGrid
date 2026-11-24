import * as Lucide from './ShellGlyph.lucide';

/** An alert's bare mark, for a part that draws its own ring or badge: Lucide draws it only in a circle. */
const AlertMarkIcon = Lucide.createLucideIcon({
  name: 'alert-mark',
  node: [
    ['path', { d: 'M12 8v4', key: 'stem' }],
    ['path', { d: 'M12 16h.01', key: 'point' }],
  ],
});

/** An inverter — DC in, AC out across a box, the symbol on its nameplate: Lucide draws none. */
const InverterIcon = Lucide.createLucideIcon({
  name: 'inverter',
  node: [
    ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', key: 'box' }],
    ['path', { d: 'M19 5 5 19', key: 'split' }],
    ['path', { d: 'M6.5 8h5', key: 'dc' }],
    ['path', { d: 'M12.5 16c1-1.3 2-1.3 3 0s2 1.3 3 0', key: 'ac' }],
  ],
});

/*
 * What a roof part is, for the design studio's chips and rows: Lucide draws none of these.
 */

/** Steps going up: a stair room. */
const StepsIcon = Lucide.createLucideIcon({
  name: 'steps',
  node: [['path', { d: 'M3 20h5v-5h5v-5h5V5h3', key: 'steps' }]],
});

/** A sheet on two posts: an open shed. */
const CanopyIcon = Lucide.createLucideIcon({
  name: 'canopy',
  node: [
    ['path', { d: 'M2 9l10-4 10 4', key: 'sheet' }],
    ['path', { d: 'M5 8v12', key: 'post-left' }],
    ['path', { d: 'M19 8v12', key: 'post-right' }],
  ],
});

/** A square cut in a square: a hole in a roof. */
const OpeningIcon = Lucide.createLucideIcon({
  name: 'opening',
  node: [
    ['rect', { x: '3.5', y: '3.5', width: '17', height: '17', rx: '2', key: 'roof' }],
    ['rect', { x: '8.5', y: '8.5', width: '7', height: '7', rx: '1', key: 'hole' }],
  ],
});

/** One box on another, set back: an upper floor. */
const StoreysIcon = Lucide.createLucideIcon({
  name: 'storeys',
  node: [
    ['rect', { x: '4', y: '12', width: '16', height: '8', rx: '1', key: 'lower' }],
    ['rect', { x: '7', y: '4', width: '14', height: '8', rx: '1', key: 'upper' }],
  ],
});

/** An arrow pushed back into a corner: a shape cut back to an edge. */
const TrimIcon = Lucide.createLucideIcon({
  name: 'trim',
  node: [
    ['path', { d: 'M4 4v16h16', key: 'edge' }],
    ['path', { d: 'M9 15l6-6', key: 'shaft' }],
    ['path', { d: 'M12 9h3v3', key: 'head' }],
  ],
});

/**
 * Every icon `packages/ui` draws, for both halves (`F7-19`): Lucide's, and the ones it lacks drawn
 * in its style (24 box, 2 stroke, round ends). Named for the shape, never the product word it
 * stands for — the caller picks which shape means what.
 */
export const SHELL_GLYPHS = {
  alert: AlertMarkIcon,
  'alert-circle': Lucide.CircleAlertIcon,
  'alert-triangle': Lucide.TriangleAlertIcon,
  archive: Lucide.ArchiveIcon,
  'arrow-down': Lucide.ArrowDownIcon,
  'arrow-right': Lucide.ArrowRightIcon,
  'arrow-up-right': Lucide.ArrowUpRightIcon,
  'bar-chart': Lucide.ChartColumnIcon,
  battery: Lucide.BatteryIcon,
  bell: Lucide.BellIcon,
  blocked: Lucide.BanIcon,
  board: Lucide.SquareKanbanIcon,
  bold: Lucide.BoldIcon,
  bolt: Lucide.ZapIcon,
  box: Lucide.BoxIcon,
  briefcase: Lucide.BriefcaseIcon,
  building: Lucide.BuildingIcon,
  calendar: Lucide.CalendarIcon,
  'calendar-check': Lucide.CalendarCheckIcon,
  'calendar-clock': Lucide.CalendarClockIcon,
  camera: Lucide.CameraIcon,
  canopy: CanopyIcon,
  cart: Lucide.ShoppingCartIcon,
  chat: Lucide.MessageCircleIcon,
  check: Lucide.CheckIcon,
  'check-check': Lucide.CheckCheckIcon,
  chevron: Lucide.ChevronDownIcon,
  'chevron-left': Lucide.ChevronLeftIcon,
  'chevron-right': Lucide.ChevronRightIcon,
  'chevron-up': Lucide.ChevronUpIcon,
  'chevrons-up-down': Lucide.ChevronsUpDownIcon,
  'circle-check': Lucide.CircleCheckIcon,
  clipboard: Lucide.ClipboardIcon,
  clock: Lucide.ClockIcon,
  close: Lucide.XIcon,
  'cloud-off': Lucide.CloudOffIcon,
  cog: Lucide.SettingsIcon,
  columns: Lucide.Columns2Icon,
  command: Lucide.CommandIcon,
  copy: Lucide.CopyIcon,
  'credit-card': Lucide.CreditCardIcon,
  document: Lucide.FileTextIcon,
  dot: Lucide.DotIcon,
  dots: Lucide.EllipsisIcon,
  download: Lucide.DownloadIcon,
  expand: Lucide.ExpandIcon,
  eye: Lucide.EyeIcon,
  'eye-off': Lucide.EyeOffIcon,
  file: Lucide.FileIcon,
  flag: Lucide.FlagIcon,
  gauge: Lucide.GaugeIcon,
  globe: Lucide.GlobeIcon,
  grid: Lucide.LayoutGridIcon,
  heading: Lucide.HeadingIcon,
  headset: Lucide.HeadsetIcon,
  house: Lucide.HouseIcon,
  image: Lucide.ImageIcon,
  'image-off': Lucide.ImageOffIcon,
  info: Lucide.InfoIcon,
  inverter: InverterIcon,
  italic: Lucide.ItalicIcon,
  /** A keyboard: a number's switch from its slider to a box to type. */
  keyboard: Lucide.KeyboardIcon,
  key: Lucide.KeyIcon,
  layer: Lucide.DiamondIcon,
  layers: Lucide.LayersIcon,
  lines: Lucide.TextAlignStartIcon,
  link: Lucide.LinkIcon,
  'link-off': Lucide.UnlinkIcon,
  /** A magnet: the studio's one drawing aid, which snaps a corner square, parallel or in line. */
  magnet: Lucide.MagnetIcon,
  'list-bullet': Lucide.ListIcon,
  'list-number': Lucide.ListOrderedIcon,
  lock: Lucide.LockIcon,
  map: Lucide.MapIcon,
  megaphone: Lucide.MegaphoneIcon,
  minus: Lucide.MinusIcon,
  'minus-circle': Lucide.CircleMinusIcon,
  monitor: Lucide.MonitorIcon,
  moon: Lucide.MoonIcon,
  move: Lucide.MoveIcon,
  note: Lucide.StickyNoteIcon,
  opening: OpeningIcon,
  package: Lucide.PackageIcon,
  pair: Lucide.UsersRoundIcon,
  palette: Lucide.PaletteIcon,
  pause: Lucide.PauseIcon,
  pencil: Lucide.PencilIcon,
  people: Lucide.UsersIcon,
  phone: Lucide.PhoneIcon,
  pin: Lucide.MapPinIcon,
  'pin-check': Lucide.MapPinCheckIcon,
  plus: Lucide.PlusIcon,
  'plus-circle': Lucide.CirclePlusIcon,
  recentre: Lucide.LocateFixedIcon,
  redo: Lucide.Redo2Icon,
  retry: Lucide.RotateCwIcon,
  ring: Lucide.CircleIcon,
  ruler: Lucide.RulerIcon,
  rupee: Lucide.IndianRupeeIcon,
  scales: Lucide.ScaleIcon,
  search: Lucide.SearchIcon,
  send: Lucide.SendIcon,
  shield: Lucide.ShieldIcon,
  'shield-check': Lucide.ShieldCheckIcon,
  sidebar: Lucide.PanelLeftIcon,
  'sign-out': Lucide.LogOutIcon,
  sliders: Lucide.SlidersHorizontalIcon,
  'solar-panel': Lucide.SolarPanelIcon,
  sort: Lucide.ArrowUpDownIcon,
  spark: Lucide.SparklesIcon,
  spreadsheet: Lucide.SheetIcon,
  star: Lucide.StarIcon,
  steps: StepsIcon,
  storeys: StoreysIcon,
  sun: Lucide.SunIcon,
  trash: Lucide.TrashIcon,
  trim: TrimIcon,
  'trend-down': Lucide.TrendingDownIcon,
  'trend-up': Lucide.TrendingUpIcon,
  /** A turn about a middle: the same arrow as `retry`, named for the shape it is drawn as here. */
  turn: Lucide.RotateCwIcon,
  truck: Lucide.TruckIcon,
  undo: Lucide.Undo2Icon,
  upload: Lucide.UploadIcon,
  user: Lucide.UserIcon,
  'user-minus': Lucide.UserMinusIcon,
  'user-plus': Lucide.UserPlusIcon,
  wallet: Lucide.WalletIcon,
  wrench: Lucide.WrenchIcon,
} as const;

/** A glyph's name: a key of `SHELL_GLYPHS`, so a name with no drawing cannot be written. */
export type ShellGlyphName = keyof typeof SHELL_GLYPHS;
