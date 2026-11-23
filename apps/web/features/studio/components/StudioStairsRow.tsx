'use client';
import type { StairsRow } from '@heliogrid/domain';
import { Pressable } from '@heliogrid/ui';
import { type SheetFacts, SheetRow } from './StudioSheetRow';

/**
 * A stair room's Stairs row (`T-M05-002`, part e, E120, board 1.4): where its stairs are, and —
 * open — its sides that open onto the roof and Outside, so the stairs move without a drag. A side
 * puts them at its middle; Outside closes the sheet for a tap on a roof's edge in the top view.
 */
export function StudioStairsRow({
  facts,
  room,
  row,
}: {
  facts: SheetFacts;
  room: number;
  /** `null` on a roof that is no stair room: no row. */
  row: StairsRow | null;
}) {
  const { studio, words } = facts;
  if (row === null) return null;
  const options = [
    ...row.sides.map((each) => ({ key: String(each.side), on: each.side, atM: each.middleM })),
    { key: 'outside', on: 'outside' as const, atM: 0 },
  ];
  return (
    <SheetRow facts={facts} rowKey="stairs" label={words.rowStairs} value={words.stairsOn(row)}>
      <fieldset className="hg-sheet-choices" aria-label={words.rowStairs}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            className="hg-sheet-choice"
            accessibilityRole="radio"
            accessibilityState={{ checked: row.on === option.on }}
            onPress={() => studio.moves.stairsOnSide(room, option.on, option.atM)}
          >
            {option.on === 'outside' ? words.stairsOutside : words.stairsSide(row, option.on)}
          </Pressable>
        ))}
      </fieldset>
    </SheetRow>
  );
}
