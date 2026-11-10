import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HeroPanelMenu } from '../HeroPanel/HeroPanel.types';
import type { MenuItem } from '../Menu/Menu.types';
import type { LeadHeroProps, LeadRecordAct } from './LeadHero.types';

/** The record menu's order; `Menu` itself puts junk, a destructive row, last behind a gap. */
const LEAD_RECORD_ACTS: readonly LeadRecordAct[] = ['add-referral', 'merge', 'junk'];

/** Each safe act's glyph; junk draws the menu's own trash, as every destructive row does. */
const RECORD_ACT_GLYPH: Record<Exclude<LeadRecordAct, 'junk'>, ShellGlyphName> = {
  'add-referral': 'person-plus',
  merge: 'layers',
};

/**
 * The hero's corner menu: the offered acts in order, each safe one with its glyph — drawn by the
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
