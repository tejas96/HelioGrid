import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { PendingAction } from '../PendingAction';
import { DOCK_ACTION_GLYPH, STATE_ACT_GLYPH } from './LeadActionDock.glyphs';
import type {
  LeadActionDockProps,
  LeadDockAct,
  LeadDockCall,
  LeadDockStateStanding,
} from './LeadActionDock.types';

/**
 * The lead's five actions (`M02-32`): Call biggest and first — a `tel:` link, or off with why —
 * and Message, Log activity, Book visit and Create design beside it; under them the state acts the
 * lead's standing offers; junk and the record's other acts are the hero's ⋯.
 */
export function LeadActionDock({
  layout,
  call,
  callLabel,
  acts,
  stateActs,
  standing,
}: LeadActionDockProps) {
  const waiting = standing?.kind === 'waiting';
  return (
    <div className="hg-lead-dock" data-layout={layout}>
      <div className="hg-lead-dock-acts">
        <CallAct call={call} label={callLabel} />
        {layout === 'grid' ? (
          <div className="hg-lead-dock-grid">
            {acts.map((act) => (
              <GridAct key={act.action} act={act} />
            ))}
          </div>
        ) : (
          <div className="hg-lead-dock-rounds">
            {acts.map((act) => (
              <RoundAct key={act.action} act={act} />
            ))}
          </div>
        )}
      </div>
      <div className="hg-lead-dock-states">
        {stateActs.map((each) => (
          <Button
            key={each.act}
            variant="secondary"
            size="sm"
            disabled={waiting}
            loading={standing?.kind === 'waiting' && standing.act === each.act}
            icon={<ShellGlyph name={STATE_ACT_GLYPH[each.act]} size="sm" tone="secondary" />}
            onClick={each.onPress}
          >
            {each.label}
          </Button>
        ))}
      </div>
      <Standing standing={standing} />
    </div>
  );
}

function CallAct({ call, label }: { call: LeadDockCall; label: LeadActionDockProps['callLabel'] }) {
  const glyph = <ShellGlyph name={DOCK_ACTION_GLYPH.call} size="md" tone="inverse" />;
  if (call.kind === 'blocked') {
    return (
      <Button
        className="hg-lead-dock-call"
        variant="primary"
        size="lg"
        fullWidth
        disabled
        disabledReason={call.reason}
        icon={glyph}
      >
        {label}
      </Button>
    );
  }
  return (
    <a
      className="hg-button hg-lead-dock-call"
      data-variant="primary"
      data-size="lg"
      data-full-width="true"
      href={`tel:${call.phoneE164}`}
    >
      {glyph}
      {label}
    </a>
  );
}

function GridAct({ act }: { act: LeadDockAct }) {
  return (
    <Button
      variant="secondary"
      size="lg"
      fullWidth
      disabled={act.disabledReason !== null}
      disabledReason={act.disabledReason ?? undefined}
      icon={<ShellGlyph name={DOCK_ACTION_GLYPH[act.action]} size="sm" tone="secondary" />}
      onClick={act.onPress}
    >
      {act.label}
    </Button>
  );
}

/** The phone's round act: the circle names the act; the short word under it is for the eye. */
function RoundAct({ act }: { act: LeadDockAct }) {
  return (
    <span className="hg-lead-dock-round">
      <IconButton
        label={act.label}
        disabled={act.disabledReason !== null}
        disabledReason={act.disabledReason ?? undefined}
        onClick={act.onPress}
      >
        <ShellGlyph name={DOCK_ACTION_GLYPH[act.action]} size="md" tone="primary" />
      </IconButton>
      <span className="hg-lead-dock-round-word" aria-hidden="true">
        {act.short}
      </span>
    </span>
  );
}

function Standing({ standing }: { standing: LeadDockStateStanding | null }) {
  if (standing === null) return null;
  return standing.kind === 'waiting' ? (
    <PendingAction label={standing.line} />
  ) : (
    <PendingAction state="returned" reason={standing.reason} />
  );
}
