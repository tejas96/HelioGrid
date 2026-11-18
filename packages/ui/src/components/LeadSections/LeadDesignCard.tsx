import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Badge } from '../Chip';
import { Menu } from '../Menu';
import { StatusChip } from '../StatusChip';
import { leadDesignMenuOf, leadDesignStatusGlyph, mayChangeDesigns } from './LeadSections.designs';
import type { LeadDesign, LeadDesignsPanel } from './LeadSections.types';

interface LeadDesignCardProps {
  readonly design: LeadDesign;
  readonly panel: LeadDesignsPanel;
}

/**
 * One design of the lead, on the web: its cover — pressed to open it, the recommended mark laid on
 * it — its name and where it stands, what it holds, who made it and when, then its acts: *Continue*
 * and the overflow for a reader who may change it, *View* alone for every other.
 */
export function LeadDesignCard({ design, panel }: LeadDesignCardProps) {
  const { words } = panel;
  const glyph = leadDesignStatusGlyph(design.status);
  const open = () => panel.onOpen(design.id);
  return (
    <li className="hg-lead-design">
      <Pressable
        className="hg-lead-design-open"
        accessibilityLabel={words.openNamed(design)}
        onPress={open}
      >
        <span className="hg-lead-design-cover" data-marked={design.recommended ? '' : undefined}>
          {design.recommended ? (
            <span className="hg-lead-design-mark">
              <Badge tone="accent" glyph="star">
                {words.recommended}
              </Badge>
            </span>
          ) : null}
          <span className="hg-lead-design-cover-word">{words.noPanels}</span>
        </span>
      </Pressable>
      <div className="hg-lead-design-top">
        <b>{words.named(design)}</b>
        <StatusChip
          status={design.status}
          label={words.status(design.status)}
          tone="neutral"
          density="functional"
          {...(glyph === null
            ? {}
            : { glyph: <ShellGlyph name={glyph} size="sm" tone="secondary" /> })}
        />
      </div>
      <span className="hg-lead-design-facts">{words.noPanels}</span>
      <span className="hg-lead-design-line">{words.line(design)}</span>
      <div className="hg-lead-design-acts">
        {mayChangeDesigns(panel) ? (
          <>
            <Button
              variant="primary"
              size="sm"
              iconRight={<ShellGlyph name="arrow-right" size="sm" tone="inverse" />}
              onClick={open}
            >
              {words.continue}
            </Button>
            <Menu
              label={words.moreNamed(design)}
              disabled={panel.busy}
              items={leadDesignMenuOf(design, panel).map(({ glyph: name, ...act }) => ({
                ...act,
                icon: <ShellGlyph name={name} size="md" />,
              }))}
            />
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            icon={<ShellGlyph name="eye" size="sm" tone="primary" />}
            onClick={open}
          >
            {words.view}
          </Button>
        )}
      </div>
    </li>
  );
}
