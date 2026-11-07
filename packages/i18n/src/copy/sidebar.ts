/**
 * The desktop sidebar's own words (direction A of the redesign): its search's prompt, the quiet
 * tag on a list whose module has not landed, the collapse control and the account's line.
 */
export const SIDEBAR = {
  searchOrJump: /*i18n*/ { id: 'Search or jump to…' },
  /** The keys that bring the search to hand, shown beside it: on a Mac the letter beside the
   *  Command key's glyph (no bundled face draws ⌘), on every other keyboard both words. */
  jumpKeyMac: /*i18n*/ { id: 'K' },
  jumpKeys: /*i18n*/ { id: 'Ctrl K' },
  soon: /*i18n*/ { id: 'Soon' },
  soonNamed: /*i18n*/ { id: '{label}, coming soon' },
  collapse: /*i18n*/ { id: 'Collapse the sidebar' },
  expand: /*i18n*/ { id: 'Expand the sidebar' },
  /** The account block's quiet line: the role in force and the company. */
  roleAt: /*i18n*/ { id: '{role} · {company}' },
} as const;
