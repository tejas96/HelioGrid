import type { RolePreset } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
 * banner when they did not load, the twelve tiles two across, and the opened role's sheet.
 * Read-only: no act here changes a role (`M01-21`).
 */
export function RolesReference({
  words,
  counts,
  onRetry,
  title,
  back = null,
}: RolesReferenceProps) {
  const [open, setOpen] = useState<RolePreset | null>(null);
  const [last, setLast] = useState<RolePreset | null>(null);
  const [side, setSide] = useState<RolesReferenceSide>('can');
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
    <Text variant="body-sm" color="secondary" style={styles.lede}>
      {words.lede}
    </Text>
  );
  /* Two tiles to a row, each row's pair the same height. */
  const rows: (typeof words.presets)[] = [];
  for (let at = 0; at < words.presets.length; at += 2) rows.push(words.presets.slice(at, at + 2));
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
      {counts === 'failed' ? (
        <Banner
          kind="data-integrity"
          density="functional"
          title={words.countsFailed}
          action={<BannerAction onClick={onRetry}>{words.retry}</BannerAction>}
        />
      ) : null}
      <View accessibilityRole="list" accessibilityLabel={words.roles} style={styles.tiles}>
        {rows.map((pair) => (
          <View key={pair.map((each) => each.value).join()} style={styles.pair}>
            {pair.map((each) => (
              <RoleTile
                key={each.value}
                preset={each}
                counts={counts}
                countGap={words.countGap}
                open={each.value === open}
                onOpen={() => {
                  setOpen(each.value);
                  setLast(each.value);
                  setSide('can');
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <RoleDetails
        preset={shown}
        open={open !== null}
        counts={counts}
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
  tiles: { gap: theme.layout['tile-gap'] },
  pair: { flexDirection: 'row', gap: theme.layout['tile-gap'] },
});
