import { SITE_NAME_MAX } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Input } from '../Input/Input.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { SiteConnectionFields } from './SiteConnectionFields.native';
import { mountOf, mountOptionsOf, SITE_MEASURE } from './SiteDetails.logic';
import type { SiteDetailsProps } from './SiteDetails.types';
import { SiteFormBar } from './SiteFormBar.native';
import { SiteLocationField } from './SiteLocationField.native';
import { SitePinMap } from './SitePinMap.native';

/**
 * Site details on the phone (`SCR-M05-01`): the same flat form, one field a row where the room is
 * narrow and two where it is wide, ending in its bar. It scrolls with the page that holds it — the
 * page's own frame answers the keyboard — so it draws no scroller of its own.
 */
export function SiteDetails(props: SiteDetailsProps) {
  const { room, form, saving, acts, words } = props;
  const wide = room === 'wide';
  return (
    <View style={[styles.form, wide ? styles.formWide : undefined]}>
      {props.head}
      <View style={wide ? styles.pair : styles.stack}>
        <Input
          label={words.name}
          value={form.name}
          maxLength={SITE_NAME_MAX}
          disabled={saving}
          onChange={acts.onName}
          style={wide ? styles.cell : undefined}
        />
        <View style={[styles.field, wide ? styles.cell : undefined]}>
          <SegmentedControl
            label={words.mount}
            fill
            value={form.mount}
            options={mountOptionsOf(words)}
            onChange={(value) => {
              const mount = mountOf(value);
              if (mount !== null && !saving) acts.onMount(mount);
            }}
          />
          <Text variant="field-helper" color="secondary">
            {words.mountHelp[form.mount]}
          </Text>
        </View>
      </View>
      <SiteLocationField
        form={form}
        search={props.search}
        saving={saving}
        acts={acts}
        words={words}
      />
      <SitePinMap
        room={room}
        form={form}
        pin={props.pin}
        pinMoved={props.pinMoved}
        map={props.map}
        saving={saving}
        acts={acts}
        words={words}
      />
      <SiteConnectionFields
        room={room}
        form={form}
        areas={props.areas}
        operators={props.operators}
        saving={saving}
        acts={acts}
        words={words}
      />
      <SiteFormBar
        room={room}
        form={form}
        saving={saving}
        failure={props.failure}
        acts={acts}
        words={words}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing['sp-5'] },
  formWide: { width: '100%', maxWidth: SITE_MEASURE, alignSelf: 'center' },
  stack: { gap: theme.spacing['sp-5'] },
  pair: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-4'] },
  /* Equal cells: a growing child sized to its content would crush its neighbour. */
  cell: { flex: 1, minWidth: 0 },
  field: { gap: theme.spacing['sp-2'] },
});
