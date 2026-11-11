import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HeroPanelMenu } from '../HeroPanel/HeroPanel.types';
import { STATE_ACT_GLYPH } from '../LeadActionDock/LeadActionDock.glyphs';
import type { MenuItem } from '../Menu/Menu.types';
import type { LeadHeroProps, LeadRecordAct } from './LeadHero.types';

/** The record menu's order; `Menu` itself puts junk, a destructive row, last behind a gap. */
const LEAD_RECORD_ACTS: readonly LeadRecordAct[] = [
  'snooze',
  'disqualify',
  'mark-won',
  'add-referral',
  'merge',
  'junk',
];

/** Each safe act's glyph; junk draws the menu's own trash, as every destructive row does. */
const RECORD_ACT_GLYPH: Record<Exclude<LeadRecordAct, 'junk'>, ShellGlyphName> = {
  snooze: STATE_ACT_GLYPH.snooze,
  disqualify: STATE_ACT_GLYPH.disqualify,
  'mark-won': 'circle-check',
  'add-referral': 'person-plus',
  merge: 'layers',
};

/**
 * The record menu — the wide hero's corner, the narrow page's top bar: the offered acts in order, each safe one with its glyph — drawn by the
 * caller's platform — and junk as the destructive row. No act offered draws no menu.
 */
export function leadRecordMenuOf(
  {
    recordActs,
    recordActsOff,
    words,
  }: Pick<LeadHeroProps, 'recordActs' | 'recordActsOff' | 'words'>,
  glyph: (name: ShellGlyphName) => ReactNode,
): HeroPanelMenu | undefined {
  const label: Record<LeadRecordAct, MenuItem['label']> = {
    snooze: words.recordActs.snooze,
    disqualify: words.recordActs.disqualify,
    'mark-won': words.recordActs.markWon,
    'add-referral': words.recordActs.addReferral,
    merge: words.recordActs.merge,
    junk: words.recordActs.junk,
  };
  const items = LEAD_RECORD_ACTS.flatMap((act): MenuItem[] => {
    const press = recordActs.find((each) => each.act === act);
    if (press === undefined) return [];
    return act === 'junk'
      ? [{ key: act, label: label[act], destructive: true, onSelect: press.onPress }]
      : [
          {
            key: act,
            label: label[act],
            icon: glyph(RECORD_ACT_GLYPH[act]),
            onSelect: press.onPress,
          },
        ];
  });
  return items.length === 0
    ? undefined
    : { label: words.recordActs.label, items, disabled: recordActsOff };
}
