import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { Menu } from '../Menu/Menu.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { leadDesignMenuOf, leadDesignStatusGlyph, mayChangeDesigns } from './LeadSections.designs';
import type { LeadDesign, LeadDesignsPanel } from './LeadSections.types';

interface LeadDesignCardProps {
  readonly design: LeadDesign;
  readonly panel: LeadDesignsPanel;
}

/** The mark on the cover: backed by the card colour, so it reads over whatever the cover shows. */
function CoverMark({ children }: { children: ReactNode }) {
  const { ground } = useGround();
  return <View style={[styles.mark, { backgroundColor: ground }]}>{children}</View>;
}

/**
 * One design of the lead, on the phone: its cover — pressed to open it, the recommended mark laid
 * on it — its name and where it stands, what it holds, who made it and when, then its acts:
 * *Continue* and the overflow for a reader who may change it, *View* alone for every other.
 */
export function LeadDesignCard({ design, panel }: LeadDesignCardProps) {
  const { words } = panel;
  const glyph = leadDesignStatusGlyph(design.status);
  const open = () => panel.onOpen(design.id);
  return (
    <View style={[tileSurface, styles.card]}>
      {/* A tile's controls take the tile's fill, so the overflow and *View* show on the white card. */}
      <GroundProvider ground="tile">
        <Pressable accessibilityLabel={words.openNamed(design)} onPress={open} style={styles.open}>
          <View style={[styles.cover, design.recommended ? styles.marked : undefined]}>
            {design.recommended ? (
              <CoverMark>
                <Badge tone="accent" glyph="star">
                  {words.recommended}
                </Badge>
              </CoverMark>
            ) : null}
            <Text variant="body-sm" color="secondary" align="center">
              {words.noPanels}
            </Text>
          </View>
        </Pressable>
        <View style={styles.top}>
          <Text variant="body-lg" bold style={styles.name}>
            {words.named(design)}
          </Text>
          <StatusChip
            status={design.status}
            label={words.status(design.status)}
            tone="neutral"
            density="functional"
            {...(glyph === null
              ? {}
              : { glyph: <ShellGlyph name={glyph} size="sm" tone="secondary" /> })}
          />
        </View>
        <Text variant="body-sm">{words.noPanels}</Text>
        <Text variant="body-sm" color="secondary">
          {words.line(design)}
        </Text>
        <View style={styles.acts}>
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
        </View>
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
  },
  /* `Pressable` centres its content; the cover fills the card's width. Its corners are on the
     target too, so Android draws no square ripple over them. */
  open: { alignItems: 'stretch', borderRadius: theme.radius['r-sm'] },
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.spacing['sp-16'],
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-sm'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
    backgroundColor: colors['canvas-sunken'],
    overflow: 'hidden',
  },
  /* The mark lies on the cover's corner, so the words under it start below it. */
  marked: {
    paddingTop: theme.spacing['sp-2'] + theme.layout['badge-h'] + theme.spacing['sp-1'],
  },
  mark: {
    position: 'absolute',
    top: theme.spacing['sp-2'],
    start: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-badge'],
    ...theme.elevation.e1,
  },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: theme.spacing['sp-2'],
    rowGap: theme.spacing['sp-1'],
    marginTop: theme.spacing['sp-1'],
  },
  name: { flexShrink: 1 },
  acts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-2'],
  },
});
