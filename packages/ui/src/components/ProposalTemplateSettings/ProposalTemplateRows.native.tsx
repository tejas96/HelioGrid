import { theme } from '@heliogrid/theme';
import { StyleSheet, type TextStyle, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { ReorderList } from '../ReorderList/ReorderList.native';
import { Switch } from '../Switch/Switch.native';
import type {
  ProposalTemplateSettingsProps,
  TemplatePhaseRow,
  TemplateSectionRow,
} from './ProposalTemplateSettings.types';
import { PartSource } from './TemplatePartSource.native';

/** The timeline keeps at least one phase: below it the delete buttons go (`ReorderList`). */
const PHASES_AT_LEAST = 1;

/**
 * Which sections print (`Sections part`): whose the set is, the count line, then the nine rows in
 * the document's order, each under a soft rule. A row is a switch whose words lead (D1 A); the
 * terms are the floor — a lock and *Always prints*, no switch. The switches work while the set is
 * still HelioGrid's (m19-n2b).
 */
export function TemplateSectionsPart({
  words,
  sections,
  onWriteOwn,
}: ProposalTemplateSettingsProps) {
  return (
    <View style={styles.sections}>
      <PartSource words={words} part="sections" origin={sections.origin} onWriteOwn={onWriteOwn} />
      <Text variant="caption" color="secondary">
        {words.sectionsPrint(sections.printing, sections.of)}
      </Text>
      <View>
        {sections.rows.map((row) =>
          row.floor ? (
            <FloorRow key={row.key} row={row} alwaysPrints={words.alwaysPrints} />
          ) : (
            <View key={row.key} style={styles.section}>
              <Switch
                label={row.title}
                description={row.about}
                toggleAt="end"
                checked={row.on}
                onChange={() => sections.onToggle(row.key)}
              />
            </View>
          ),
        )}
      </View>
    </View>
  );
}

/** The terms row: always in the document, so it says so where a switch would be. */
function FloorRow({ row, alwaysPrints }: { row: TemplateSectionRow; alwaysPrints: string }) {
  return (
    <View style={[styles.section, styles.floor]}>
      <View style={styles.sectionWords}>
        <Text variant="body-sm" style={medium}>
          {row.title}
        </Text>
        <Text variant="caption" color="secondary">
          {row.about}
        </Text>
      </View>
      <View style={styles.always}>
        <ShellGlyph name="lock" size="sm" tone="secondary" />
        <Text variant="caption" color="secondary">
          {alwaysPrints}
        </Text>
      </View>
    </View>
  );
}

/**
 * The project phases (`Timeline part`): whose they are, the ordered list with its controls at
 * each row's foot and the row's edit pencil first, then *Add a phase* — or the cap's line.
 */
export function TemplateTimelinePart({
  words,
  timeline,
  onWriteOwn,
}: ProposalTemplateSettingsProps) {
  return (
    <View style={styles.part}>
      <PartSource words={words} part="timeline" origin={timeline.origin} onWriteOwn={onWriteOwn} />
      <ReorderList<TemplatePhaseRow>
        items={[...timeline.phases]}
        keyOf={(phase) => phase.key}
        labelOf={(phase) => phase.title}
        label={words.projectPhases}
        itemNoun={words.phasesNoun}
        density="functional"
        controls="foot"
        minItems={PHASES_AT_LEAST}
        renderItem={(phase) => (
          <View style={styles.phase}>
            <Text variant="body-sm" style={medium}>
              {phase.title}
            </Text>
            <Text variant="caption" color="secondary">
              {phase.note}
            </Text>
          </View>
        )}
        actionOf={(phase) => (
          <IconButton
            label={words.editPhase(phase.title)}
            size={40}
            variant="ghost"
            onClick={() => timeline.onEdit(phase.key)}
          >
            <ShellGlyph name="pencil" size="sm" tone="primary" />
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
        <View style={styles.add}>
          <Button variant="secondary" size="md" onClick={timeline.onAdd}>
            {words.addPhase}
          </Button>
        </View>
      )}
    </View>
  );
}

/* The title's weight is --fw-medium, which the body-sm role does not carry (as `Switch`'s title). */
const medium: TextStyle = { fontWeight: `${theme.type.weights.medium}` };

const styles = StyleSheet.create({
  /** A part's blocks, `sp-4` apart. */
  part: { gap: theme.spacing['sp-4'] },
  /** The source line, the count line and the rows, `sp-2` apart. */
  sections: { gap: theme.spacing['sp-2'] },
  /** A row under its soft rule, `sp-1 + sp-0-5` above and below. */
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-1'] + theme.spacing['sp-0-5'],
    borderTopWidth: 1,
    borderTopColor: theme.colors['line-soft'],
  },
  floor: { minHeight: theme.spacing['sp-12'] },
  sectionWords: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  always: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  /** A phase's name over its sentence. */
  phase: { gap: theme.spacing['sp-1'], minWidth: 0 },
  /** *Add a phase* at its own width. */
  add: { flexDirection: 'row' },
});
