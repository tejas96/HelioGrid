'use client';
import type { SideRole, SideSheetRows } from '@heliogrid/domain';
import { Button, SegmentedControl, Switch } from '@heliogrid/ui';
import { NumberRow, type SheetFacts, SheetRow } from './StudioSheetRow';

/**
 * A side's sheet (`T-M05-002`, part e, board 6.3): opened by a tap on one side on the model, it
 * holds that side's parapet, its parapet height and its own setback, each with a reset to the
 * roof's; on a sloped roof its own overhang and, where it rises as a face of its own, its slope and
 * how far its eave is raised; and what the side is to the shape — the low side, the glass side, or
 * an end that is a gable end or a hip.
 */
export function StudioSideRows({ facts, side }: { facts: SheetFacts; side: SideSheetRows }) {
  const { studio, words } = facts;
  const { moves } = studio;
  const why = words.sideWallWhy(side.parapet.why);
  const role = side.role;
  return (
    <>
      <SheetRow
        facts={facts}
        rowKey="parapet"
        label={words.rowParapet}
        value={words.sideWall(side.parapet.on)}
      >
        <Switch checked={side.parapet.on} label={words.rowParapet} onChange={moves.setSideWall} />
        {side.parapet.why.kind === 'person' ? (
          <span className="hg-sheet-reset">
            <Button variant="ghost" size="md" onClick={moves.sideWallFollows}>
              {words.followRoof}
            </Button>
          </span>
        ) : null}
      </SheetRow>
      {why === null ? null : <p className="hg-sheet-line">{why}</p>}
      {side.parapetHeight === null ? null : (
        <NumberRow
          facts={facts}
          shown={side.parapetHeight}
          label={words.rowNumber('parapet_height')}
          waits={side.heightWaits}
          onSide
        />
      )}
      <NumberRow facts={facts} shown={side.setback} label={words.rowNumber('setback')} onSide />
      {side.overhang === null ? null : (
        <NumberRow facts={facts} shown={side.overhang} label={words.rowNumber('overhang')} onSide />
      )}
      {side.slope === null ? null : (
        <NumberRow facts={facts} shown={side.slope} label={words.rowNumber('slope')} onSide />
      )}
      {side.eave === null ? null : (
        <NumberRow facts={facts} shown={side.eave} label={words.rowNumber('eave')} onSide />
      )}
      {role === null ? null : <SideRoleRow facts={facts} role={role} />}
    </>
  );
}

/** What the side is to the roof's shape: an end, a gable end or a hip; or the low side, or the glass side. */
function SideRoleRow({ facts, role }: { facts: SheetFacts; role: SideRole }) {
  const { studio, words } = facts;
  const { moves } = studio;
  const editable = studio.editing.kind === 'editor';
  if (role.kind === 'end') {
    return (
      <div className="hg-sheet-row">
        <div className="hg-sheet-row-head">
          <span className="hg-sheet-row-label">{words.endTitle}</span>
          {editable ? null : <span className="hg-sheet-row-value">{words.end(role.end)}</span>}
        </div>
        {editable ? (
          <SegmentedControl
            ariaLabel={words.endTitle}
            value={role.end}
            options={[
              { value: 'gable', label: words.end('gable') },
              { value: 'hip', label: words.end('hip') },
            ]}
            onChange={(end) => moves.endSide(end === 'gable' ? 'gable' : 'hip')}
          />
        ) : null}
      </div>
    );
  }
  const low = role.kind === 'low';
  return (
    <div className="hg-sheet-row">
      <div className="hg-sheet-row-head">
        <span className="hg-sheet-row-label">{low ? words.lowSide : words.glassSide}</span>
        {role.is ? (
          <span className="hg-sheet-row-value">{low ? words.lowHere : words.glassHere}</span>
        ) : null}
      </div>
      {!role.is && editable ? (
        <span className="hg-sheet-reset">
          <Button variant="secondary" size="md" onClick={() => moves.markSide(role.kind)}>
            {low ? words.makeLow : words.makeGlass}
          </Button>
        </span>
      ) : null}
    </div>
  );
}
