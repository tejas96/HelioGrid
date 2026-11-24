'use client';
import type { HandFaceRows, RoofSheetRows } from '@heliogrid/domain';
import { Button, Pressable } from '@heliogrid/ui';
import { NumberRow, type SheetFacts, SheetRow } from './StudioSheetRow';

/**
 * An Any-shape roof's Faces row (`T-M05-002`, part e, E082, board 5.10): how far its faces are
 * drawn by hand. Faces not drawn, or drawn in part, are drawn on with one tap, in the top view; a
 * roof that stands in its faces opens the row first, where Draw again takes them away to draw anew.
 */
export function StudioFacesRow({ facts, rows }: { facts: SheetFacts; rows: RoofSheetRows }) {
  const { studio, words } = facts;
  const faces = rows.faces;
  if (faces === null) return null;
  const draw = () => studio.moves.drawFaces(rows.roof);
  const value = words.facesValue(faces.drawn, faces.count);
  if (faces.drawn !== 'whole') {
    return (
      <SheetRow
        facts={facts}
        rowKey="faces"
        label={words.rowFaces}
        value={value}
        waits={faces.drawn === 'part'}
        onOpen={draw}
      />
    );
  }
  return (
    <SheetRow facts={facts} rowKey="faces" label={words.rowFaces} value={value}>
      <span className="hg-sheet-reset">
        <Button variant="secondary" size="md" onClick={draw}>
          {words.facesDraw(faces.drawn)}
        </Button>
      </span>
    </SheetRow>
  );
}

/**
 * One face's own sheet, opened by a tap on it in 3D: its slope, which follows the roof's until set
 * here, and the side it slopes down to, each side named by the way it looks.
 */
export function StudioFaceRows({ facts, face }: { facts: SheetFacts; face: HandFaceRows }) {
  const { studio, words } = facts;
  const sides = words.faceSides(face);
  const low = sides.find((each) => each.side === face.low)?.label ?? null;
  return (
    <>
      <NumberRow facts={facts} shown={face.slope} label={words.rowNumber('slope')} onFace />
      <SheetRow facts={facts} rowKey="low" label={words.faceSlopesDown} value={low}>
        <fieldset className="hg-sheet-choices" aria-label={words.faceSlopesDown}>
          {sides.map((each) => (
            <Pressable
              key={each.side}
              className="hg-sheet-choice"
              accessibilityRole="radio"
              accessibilityState={{ checked: face.low === each.side }}
              onPress={() => studio.moves.setFaceLow(each.side)}
            >
              {each.label}
            </Pressable>
          ))}
        </fieldset>
      </SheetRow>
    </>
  );
}
