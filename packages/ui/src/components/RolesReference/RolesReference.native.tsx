import type { RolePreset } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellAction } from '../AppShell/ShellAction.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { Explainer } from '../Explainer/Explainer.native';
import { RoleDetails } from './RoleDetails.native';
import type { RolesReferenceProps, RolesReferenceSide } from './RolesReference.types';
import { RoleTile } from './RoleTile.native';

/**
 * The Roles reference on the phone: the lede with its ask (the bar holds the title), the counts'
 * banner when they did not load, the twelve roles as one card of rows, and the opened role's sheet.
 * Read-only: no act here changes a role (`M01-21`).
 */
export function RolesReference({ words, read, title, back = null }: RolesReferenceProps) {
  const [open, setOpen] = useState<RolePreset | null>(null);
  const [last, setLast] = useState<RolePreset | null>(null);
  const [side, setSide] = useState<RolesReferenceSide>('can');
  /* *Try again* leaves with its banner: the screen reader goes to the role tiles, which stay. */
  const tiles = useRef<View>(null);
  const shown = words.presets.find((each) => each.value === last) ?? null;
  const about = (
    <Explainer
      label={words.about.label}
      title={words.about.label}
      density="functional"
      placement="bottom"
      inset
      pages={words.about.pages}
      nextLabel={words.about.nextLabel}
      backLabel={words.about.backLabel}
      positionLabel={words.about.positionLabel}
    />
  );
  const lede = (
    <Text variant="body" color="secondary" style={styles.lede}>
      {words.lede}
    </Text>
  );
  return (
    <View style={styles.page}>
      {title === 'page' ? (
        <View style={styles.head}>
          <View style={styles.row}>
            {back === null ? null : (
              <ShellAction
                round
                label={back.label}
                onClick={back.onPress}
                icon={<ShellGlyph name="chevron-left" size="md" tone="primary" />}
              />
            )}
            <Text variant="h2">{words.title}</Text>
            {about}
          </View>
          {lede}
        </View>
      ) : (
        <View style={styles.row}>
          {lede}
          {about}
        </View>
      )}
      {read.kind === 'failed' ? (
        <Banner
          kind="data-integrity"
          density="functional"
          title={words.countsFailed}
          action={
            <BannerAction onClick={read.retry} focusAfter={tiles}>
              {words.retry}
            </BannerAction>
          }
        />
      ) : null}
      {/* One card of rows, as the web draws a narrow room: a name and a count are small facts. The
          inner frame clips the rows' press to the card's corners; the card keeps its shadow. */}
      <View style={[tileSurface, styles.card]}>
        <View
          ref={tiles}
          accessibilityRole="list"
          accessibilityLabel={words.roles}
          style={styles.rows}
        >
          <GroundProvider ground="tile">
            {words.presets.map((each, index) => (
              <RoleTile
                key={each.value}
                preset={each}
                first={index === 0}
                counts={read.kind}
                countGap={words.countGap}
                open={each.value === open}
                onOpen={() => {
                  setOpen(each.value);
                  setLast(each.value);
                  setSide('can');
                }}
              />
            ))}
          </GroundProvider>
        </View>
      </View>
      <RoleDetails
        preset={shown}
        open={open !== null}
        counts={read.kind}
        words={words}
        side={side}
        onSide={setSide}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  head: { gap: theme.spacing['sp-2'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  lede: { flex: 1, minWidth: 0 },
  card: { borderRadius: theme.radius['r-tile'] },
  rows: { borderRadius: theme.radius['r-tile'], overflow: 'hidden' },
});
