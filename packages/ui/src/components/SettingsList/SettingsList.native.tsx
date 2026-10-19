import { theme } from '@heliogrid/theme';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { GroundProvider, tileSurface, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file, as `Block.native` below. */
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Block } from '../Block/Block.native';
import { BrandBloom } from '../BrandBloom/BrandBloom.native';
import { personRow, SETTINGS_ROW_GLYPH } from './SettingsList.logic';
import type { SettingsListPerson, SettingsListProps } from './SettingsList.types';
import { SettingsSideList } from './SettingsSideList.native';

/** The person's avatar diameter in their tile, and the ring's 2px around it. */
const AVATAR = 56;
const RING = 3;
/** The bloom in the tile's corner — atmosphere, clipped by the tile; wider on the phone, where the
 *  SVG gradient's reach reads smaller than the web's radial-gradient at the same box. */
const BLOOM = 320;

/**
 * `--gradient-brand` is a CSS linear-gradient RN cannot paint; its three stops are drawn as a real
 * SVG gradient stroke around the avatar from the same tokens, the ring the web half paints.
 */
function BrandRing({ children }: { children: React.ReactNode }) {
  const id = `hg-ring-${useId()}`;
  const outer = AVATAR + RING * 2;
  const c = outer / 2;
  return (
    <View style={{ width: outer, height: outer }}>
      <Svg width={outer} height={outer} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors['iris-violet']} />
            <Stop offset="0.45" stopColor={theme.colors['iris-blue']} />
            <Stop offset="1" stopColor={theme.colors['iris-magenta']} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={c}
          cy={c}
          r={c - RING / 2}
          stroke={`url(#${id})`}
          strokeWidth={RING}
          fill="none"
        />
      </Svg>
      <View style={styles.ringInner}>{children}</View>
    </View>
  );
}

/** A white circle on the tile — its fill is the tile ground's control fill, read inside the tile. */
function TileCircle({ raised, children }: { raised: boolean; children: React.ReactNode }) {
  const { controlFill } = useGround();
  return (
    <View
      style={[
        styles.circle,
        raised ? styles.chevron : styles.icon,
        raised ? styles.raised : styles.flat,
        { backgroundColor: controlFill },
      ]}
    >
      {children}
    </View>
  );
}

function PersonTile({
  person,
  rowName,
  onPress,
}: {
  person: SettingsListPerson;
  rowName: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[tileSurface, styles.person]}>
      <GroundProvider ground="tile">
        <View pointerEvents="none" style={styles.bloom}>
          <BrandBloom size={BLOOM} />
        </View>
        <BrandRing>
          <Avatar name={person.name} src={person.picture} size={AVATAR} />
        </BrandRing>
        <View style={styles.words}>
          <Text variant="h3" bold>
            {person.name}
          </Text>
          <Text variant="body" color="secondary">
            {rowName}
          </Text>
        </View>
        <TileCircle raised>
          <ShellGlyph name="chevron-right" size="md" tone="primary" />
        </TileCircle>
      </GroundProvider>
    </Pressable>
  );
}

/**
 * The settings list: the title as the page's heading; the person's tile; then each group an
 * overline heading on the page over one grey tile holding its rows — each row a control with its
 * icon circle, its name and a chevron. Functional density. One column: the phone has no desktop
 * width.
 */
export function SettingsList({
  title,
  person,
  groups,
  onOpen,
  form = 'page',
  current,
}: SettingsListProps) {
  if (form === 'side') {
    return <SettingsSideList title={title} groups={groups} onOpen={onOpen} current={current} />;
  }
  return (
    <View style={styles.list}>
      {/* The primitive has no role prop; the heading's role sits on the node around it. */}
      <View accessibilityRole="header">
        <Text variant="h3" bold>
          {title}
        </Text>
      </View>
      {groups.map((group) => {
        const own = personRow(group);
        if (own !== null) {
          return (
            <PersonTile
              key={group.key}
              person={person}
              rowName={own.name}
              onPress={() => onOpen(own.key)}
            />
          );
        }
        return (
          <Block key={group.key} overline={group.name} density="functional" style={styles.group}>
            <View style={[tileSurface, styles.tile]}>
              <GroundProvider ground="tile">
                {group.rows.map((row) => (
                  <Pressable key={row.key} onPress={() => onOpen(row.key)} style={styles.row}>
                    <TileCircle raised={false}>
                      <ShellGlyph name={SETTINGS_ROW_GLYPH[row.key]} size="md" tone="accent" />
                    </TileCircle>
                    <View style={styles.name}>
                      <Text variant="body">{row.name}</Text>
                    </View>
                    <ShellGlyph name="chevron-right" size="md" />
                  </Pressable>
                ))}
              </GroundProvider>
            </View>
          </Block>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-6'] },
  group: { padding: 0 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-4'],
    minHeight: 96,
    padding: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
    overflow: 'hidden',
  },
  /* The bloom's box hangs off the tile's top-right corner, strongest behind the chevron. */
  bloom: {
    position: 'absolute',
    top: -140,
    right: -90,
    width: BLOOM,
    height: BLOOM,
  },
  ringInner: {
    position: 'absolute',
    top: RING,
    left: RING,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
  },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: { width: 36, height: 36, borderRadius: 18 },
  raised: { ...theme.elevation.e2 },
  flat: { ...theme.elevation.e1 },
  icon: {},
  /* A group's tile: its rows inset by the record's 8, no rule between them. */
  tile: {
    gap: theme.spacing['sp-0-5'],
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-tile'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    minHeight: 56,
    paddingLeft: theme.spacing['sp-2'],
    paddingRight: theme.spacing['sp-3'],
    borderRadius: theme.radius['rf-md'],
  },
  name: { flex: 1, minWidth: 0 },
});
