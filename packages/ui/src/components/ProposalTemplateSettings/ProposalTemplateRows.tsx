import { Icon } from '../../primitives/Icon/Icon';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { ReorderList } from '../ReorderList/ReorderList';
import { Switch } from '../Switch/Switch';
import type { TemplatePhaseRow, TemplateSectionRow } from './ProposalTemplateSettings.types';
import { type PartProps, PartSource } from './TemplatePartSource';

/** The timeline keeps at least one phase: below it the delete buttons go (`ReorderList`). */
const PHASES_AT_LEAST = 1;

/**
 * Which sections print (`Sections part`): whose the set is, the count line, then the nine rows in
 * the document's order, each under a soft rule. A row is a switch whose words lead (D1 A); the
 * terms are the floor — a lock and *Always prints*, no switch. The switches work while the set is
 * still HelioGrid's (m19-n2b): a switch makes it the tenant's.
 */
export function TemplateSectionsPart({ words, sections, onWriteOwn }: PartProps) {
  return (
    <div className="hg-template-sections">
      <PartSource words={words} part="sections" origin={sections.origin} onWriteOwn={onWriteOwn} />
      <Text variant="caption" color="secondary">
        {words.sectionsPrint(sections.printing, sections.of)}
      </Text>
      <div className="hg-template-section-list">
        {sections.rows.map((row) =>
          row.floor ? (
            <FloorRow key={row.key} row={row} alwaysPrints={words.alwaysPrints} />
          ) : (
            <div key={row.key} className="hg-template-section">
              <Switch
                label={row.title}
                description={row.about}
                toggleAt="end"
                checked={row.on}
                onChange={() => sections.onToggle(row.key)}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/** The terms row: always in the document, so it says so where a switch would be. */
function FloorRow({ row, alwaysPrints }: { row: TemplateSectionRow; alwaysPrints: string }) {
  return (
    <div className="hg-template-section" data-floor="true">
      <span className="hg-template-section-words">
        <Text variant="body-sm" className="hg-template-medium">
          {row.title}
        </Text>
        <Text variant="caption" color="secondary" className="hg-template-pretty">
          {row.about}
        </Text>
      </span>
      <span className="hg-template-always">
        <ShellGlyph name="lock" size="sm" tone="secondary" />
        <Text variant="caption" color="secondary">
          {alwaysPrints}
        </Text>
      </span>
    </div>
  );
}

/**
 * The project phases (`Timeline part`): whose they are, the ordered list with its controls at
 * each row's foot and the row's own edit pencil first, then *Add a phase* — or, at the cap, the
 * line that says why there is none.
 */
export function TemplateTimelinePart({ words, wide, timeline, onWriteOwn }: PartProps) {
  return (
    <div className="hg-template-part hg-template-timeline">
      <PartSource words={words} part="timeline" origin={timeline.origin} onWriteOwn={onWriteOwn} />
      <ReorderList<TemplatePhaseRow>
        items={[...timeline.phases]}
        keyOf={(phase) => phase.key}
        labelOf={(phase) => phase.title}
        label={words.projectPhases}
        words={words.reorderList}
        itemNoun={words.phasesNoun}
        density="functional"
        controls="foot"
        minItems={PHASES_AT_LEAST}
        renderItem={(phase) => <PhaseWords phase={phase} />}
        actionOf={(phase) => (
          <IconButton
            label={words.editPhase(phase.title)}
            size={40}
            variant="ghost"
            onClick={() => timeline.onEdit(phase.key)}
          >
            <Icon size="sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={glyphStroke('sm')}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <ShellGlyphMarks name="pencil" />
              </svg>
            </Icon>
          </IconButton>
        )}
        onMove={(_key, from, to) => timeline.onMove(from, to)}
        onDelete={(key) => {
          const phase = timeline.phases.find((held) => held.key === key);
          if (phase !== undefined) timeline.onDelete(phase.key);
        }}
      />
      {timeline.atCap ? (
        <Text variant="caption" color="secondary">
          {words.phaseCap}
        </Text>
      ) : (
        <div className="hg-template-add">
          <Button
            variant="secondary"
            size={wide ? 'sm' : 'md'}
            fullWidth={wide}
            onClick={timeline.onAdd}
          >
            {words.addPhase}
          </Button>
        </div>
      )}
    </div>
  );
}

/** A phase's name over its sentence, `sp-1` apart. */
function PhaseWords({ phase }: { phase: TemplatePhaseRow }) {
  return (
    <span className="hg-template-phase">
      <Text variant="body-sm" className="hg-template-medium hg-template-pretty">
        {phase.title}
      </Text>
      <Text variant="caption" color="secondary" className="hg-template-pretty">
        {phase.note}
      </Text>
    </span>
  );
}
