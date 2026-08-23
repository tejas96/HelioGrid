/**
 * CHECK (h)'s ROLE MAPS — the ARIA vocabulary, the React Native vocabulary, and the translation
 * between them, including the roles that have no partner at all.
 *
 * WHY IT IS ITS OWN FILE. Everything else in (h) is presence — does this half say `checked`? Role
 * is the one member where the VALUE decides, because ARIA and React Native do not name the same
 * set of things: ARIA has `menuitemradio` and RN does not, RN has `adjustable` and ARIA calls it
 * `slider`, and both have words the other simply lacks. That translation is a table, it will keep
 * growing, and it should not live inside the comparison that uses it.
 *
 * A `null` IS A SANCTIONED EXEMPTION, NOT A GAP IN THE TABLE. It says: this role exists on one
 * platform and has no partner on the other, so its absence over there is not drift. Each family of
 * nulls is explained in parity-exemptions.mjs (NO_RN_ROLE / NO_WEB_ROLE); a role that is simply
 * unmapped would be a silent skip, which is why every value here is written out.
 */
/** ARIA role → the common vocabulary. `null` means SANCTIONED: no React Native partner exists, so
 *  its absence on the native half is not drift. Each family of nulls is explained by
 *  NO_RN_ROLE in parity-exemptions.mjs. */
export const ARIA_ROLE = {
  button: 'button',
  link: 'link',
  checkbox: 'checkbox',
  radio: 'radio',
  switch: 'switch',
  tab: 'tab',
  tablist: 'tablist',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  menuitemcheckbox: 'menuitem',
  menuitemradio: 'menuitem',
  radiogroup: 'radiogroup',
  progressbar: 'progressbar',
  slider: 'adjustable',
  spinbutton: 'spinbutton',
  scrollbar: 'scrollbar',
  combobox: 'combobox',
  option: 'option',
  searchbox: 'searchbox',
  list: 'list',
  listitem: 'listitem',
  img: 'image',
  heading: 'header',
  alert: 'alert',
  toolbar: 'toolbar',
  grid: 'grid',
  table: 'table',
  columnheader: 'columnheader',
  rowheader: 'rowheader',
  row: 'row',
  cell: 'cell',
  gridcell: 'cell',
  summary: 'summary',
  timer: 'timer',
  separator: 'separator',
  // ── SANCTIONED: no React Native partner. Reasons in ROLE_EXEMPTIONS.
  // `listbox` and `textbox` are here on VERIFIED fact, not assumption: react-native 0.86's
  // ViewAccessibility.d.ts declares neither in `Role` nor in `AccessibilityRole` (it carries
  // `searchbox` but not `textbox`, and `list`/`listitem` but not `listbox`), and TS rejects
  // both outright. The nearest true native word is `list` for a listbox; a contenteditable
  // has no native partner at all. Recorded as NO_RN_ROLE so the absence is tallied and
  // printed on every run rather than silently skipped.
  listbox: null,
  textbox: null,
  status: null,
  log: null,
  marquee: null,
  presentation: null,
  none: null,
  group: null,
  rowgroup: null,
  banner: null,
  navigation: null,
  main: null,
  complementary: null,
  contentinfo: null,
  region: null,
  form: null,
  search: null,
  dialog: null,
  alertdialog: null,
  tooltip: null,
  note: null,
  article: null,
  document: null,
  application: null,
  feed: null,
  figure: null,
  meter: null,
  tabpanel: null,
};

/** React Native `accessibilityRole` → the common vocabulary. `null` is sanctioned the same way (NO_WEB_ROLE). */
export const NATIVE_ROLE = {
  button: 'button',
  togglebutton: 'button',
  imagebutton: 'button',
  link: 'link',
  search: 'searchbox',
  image: 'image',
  text: null,
  adjustable: 'adjustable',
  header: 'header',
  summary: 'summary',
  alert: 'alert',
  checkbox: 'checkbox',
  combobox: 'combobox',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  progressbar: 'progressbar',
  radio: 'radio',
  radiogroup: 'radiogroup',
  scrollbar: 'scrollbar',
  spinbutton: 'spinbutton',
  switch: 'switch',
  tab: 'tab',
  tablist: 'tablist',
  timer: 'timer',
  list: 'list',
  toolbar: 'toolbar',
  grid: 'grid',
  keyboardkey: null,
  none: null,
};

/** The implicit ARIA role of a semantic HTML element. THIS IS THE LARGEST HONEST CONCESSION IN (h):
 *  on the web a role is usually carried by the ELEMENT, not by a `role=` attribute — `<button>` IS
 *  a button and naming it again is what the redundancy lint exists to stop. React Native has no
 *  elements, so its half must spell every role out. Without this table, every correctly built pair
 *  in the package would report as native-only drift. `input` is resolved by its `type`. */
export const IMPLICIT_ROLE = {
  button: 'button',
  a: 'link',
  h1: 'header',
  h2: 'header',
  h3: 'header',
  h4: 'header',
  h5: 'header',
  h6: 'header',
  img: 'image',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  select: 'combobox',
  textarea: 'textbox',
  progress: 'progressbar',
  table: 'table',
  th: 'columnheader',
  td: 'cell',
  tr: 'row',
  hr: 'separator',
  summary: 'summary',
  dialog: null,
  nav: null,
  main: null,
  header: null,
  footer: null,
  aside: null,
  section: null,
  form: null,
  output: null,
  meter: null,
};

/** `<input type="…">` → implicit role. Anything else typed, and any untyped input, is a textbox. */
export const INPUT_ROLE = {
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'adjustable',
  search: 'searchbox',
  button: 'button',
  submit: 'button',
  reset: 'button',
  image: 'button',
};
