import { theme } from '@heliogrid/theme';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { AvatarGroup } from '../Avatar/Avatar.native';
import { IconCircle } from '../Card/Card.native';
import { TEAM_STATUS_TONE } from '../Chip/Chip.logic';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { PRESET_GLYPH } from '../SettingsList/SettingsList.logic';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { linesOn, ROLES_PANEL_ABOVE, ROLES_PANEL_WIDTH } from './RolesReference.logic';
import type {
  RolesReferenceCounts,
  RolesReferencePreset,
  RolesReferenceSide,
  RolesReferenceWordsProp,
} from './RolesReference.types';

interface RoleDetailsProps {
  /** The role last opened — kept while the details close, so they leave with their own words. */
  preset: RolesReferencePreset | null;
  open: boolean;
  /** Holders are named only once the roster is read: before, *Nobody* would be a guess. */
  counts: RolesReferenceCounts;
  words: RolesReferenceWordsProp;
  side: RolesReferenceSide;
  onSide: (side: RolesReferenceSide) => void;
  onClose: () => void;
}

/**
 * One role's details: the sheet on the phone, the side panel where the room is wide. The head, the
 * holders and *Show* stay; only the list scrolls.
 */
export function RoleDetails({
  preset,
  open,
  counts,
  words,
  side,
  onSide,
  onClose,
}: RoleDetailsProps) {
  if (preset === null) return null;
  const { label, lines } = linesOn(preset, side);
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      title={preset.name}
      closeLabel={words.close}
      showClose
      modal={false}
      side="right"
      width={ROLES_PANEL_WIDTH}
      panelAbove={ROLES_PANEL_ABOVE}
      leading={
        <IconCircle size={44}>
          <ShellGlyph name={PRESET_GLYPH[preset.value]} size="md" tone="accent" />
        </IconCircle>
      }
      sheetProps={{ subtitle: preset.summary, size: 'half', bodyScrolls: false }}
      panelProps={{ density: 'functional' }}
      meta={({ panel }) => (
        <View style={styles.meta}>
          {panel ? (
            <Text variant="body-sm" color="secondary">
              {preset.summary}
            </Text>
          ) : null}
          {counts === 'ready' ? <Holders preset={preset} nobody={words.nobody} /> : null}
          <SegmentedControl
            label={words.show}
            value={side}
            onChange={(value) => onSide(value === 'cant' ? 'cant' : 'can')}
            options={[
              { value: 'can', label: preset.canTab },
              { value: 'cant', label: preset.cantTab },
            ]}
          />
        </View>
      )}
    >
      {({ panel }) => (
        <ListRoom key={`${preset.value}-${side}`} panel={panel}>
          <View accessibilityLabel={label} accessibilityRole="list">
            {lines.map((line) => (
              <View key={line.key} style={styles.line}>
                <ShellGlyph
                  name={side === 'can' ? 'tick' : 'minus'}
                  size="md"
                  tone={side === 'can' ? 'success' : 'secondary'}
                />
                <Text
                  variant="body"
                  color={side === 'can' ? 'primary' : 'secondary'}
                  style={styles.text}
                >
                  {line.text}
                  {line.scope === null ? null : (
                    <Text variant="body" color="secondary">
                      {` · ${line.scope}`}
                    </Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        </ListRoom>
      )}
    </EditorSurface>
  );
}

/**
 * In the sheet only the list scrolls, under the held head, and once it has moved a hairline marks
 * where it is cut (`m-open-cant`). The side panel scrolls whole.
 */
function ListRoom({ panel, children }: { panel: boolean; children: ReactNode }) {
  const [cut, setCut] = useState(false);
  if (panel) return children;
  return (
    <ScrollView
      style={[styles.scroll, cut ? styles.cut : undefined]}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={(event) => setCut(event.nativeEvent.contentOffset.y > 0)}
    >
      {children}
    </ScrollView>
  );
}

/** Who holds it — active people by face and name — and who is named but not counted. */
function Holders({ preset, nobody }: { preset: RolesReferencePreset; nobody: string }) {
  return (
    <>
      <View style={styles.holders}>
        {preset.holders.length === 0 ? (
          <Text variant="body-sm">{nobody}</Text>
        ) : (
          <>
            <AvatarGroup size={32} people={preset.holders.map((name) => ({ name }))} />
            <Text variant="body-sm" style={styles.text}>
              {preset.holders.join(', ')}
            </Text>
          </>
        )}
      </View>
      {preset.others.map((other) => (
        <View key={other.id} style={styles.other}>
          <StatusChip
            status={other.status}
            label={other.word}
            tone={TEAM_STATUS_TONE[other.status]}
            density="functional"
          />
          <Text variant="body-sm">{other.name}</Text>
        </View>
      ))}
    </>
  );
}

/* The board's details: 36 a row, 32 the holders' line. */
const styles = StyleSheet.create({
  meta: { gap: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-2'] },
  holders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 32,
  },
  other: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'], minHeight: 36 },
  text: { flexShrink: 1, minWidth: 0 },
  scroll: {
    flexShrink: 1,
    minHeight: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  cut: { borderTopColor: theme.colors['line-soft'] },
});
