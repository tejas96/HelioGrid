import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { FacetChips } from '../FilterBar/FacetChips.native';
import { Menu } from '../Menu/Menu.native';
import { SearchField } from '../SearchField/SearchField.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { StageMeter } from '../StageMeter/StageMeter.native';
import { leadsListFilterBarPartsOf } from './LeadsListFilterBar.logic';
import type { LeadsListFilterBarProps } from './LeadsListFilterBar.types';

/**
 * The filters over the list on the phone, one column: whose leads, the meter, the search on its own
 * line, then the chips — every one a tap away, and still there when nothing matches.
 */
export function LeadsListFilterBar(props: LeadsListFilterBarProps) {
  const parts = leadsListFilterBarPartsOf(props, (name) => <ShellGlyph name={name} size="sm" />);
  const band = props.form === 'band';
  const whose = parts.whose === null ? null : <SegmentedControl {...parts.whose} />;
  return (
    <View style={styles.bar}>
      {band ? null : whose}
      <StageMeter {...parts.meter} />
      {band ? whose : null}
      <SearchField {...parts.search} />
      <View style={styles.chips}>
        <FacetChips {...parts.dormant} />
        {parts.bill === null ? null : <Button {...parts.bill} />}
        <Menu {...parts.sourceMenu} trigger={<Button {...parts.sourceTrigger} />} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { gap: theme.spacing['sp-4'] },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
