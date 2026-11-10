import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { FacetChips } from '../FilterBar';
import { Menu } from '../Menu/Menu';
import { SearchField } from '../SearchField/SearchField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { StageMeter } from '../StageMeter/StageMeter';
import { leadsListFilterBarPartsOf } from './LeadsListFilterBar.logic';
import type { LeadsListFilterBarProps } from './LeadsListFilterBar.types';

/**
 * The filters over the list. As the phone's card the meter stands under whose leads and the search
 * takes the chips' whole first line; as the desktop's band the meter leads and whose leads opens
 * the chips' row.
 */
export function LeadsListFilterBar(props: LeadsListFilterBarProps) {
  const parts = leadsListFilterBarPartsOf(props, (name) => <ShellGlyph name={name} size="sm" />);
  const band = props.form === 'band';
  const whose = parts.whose === null ? null : <SegmentedControl {...parts.whose} />;
  return (
    <div className="hg-leads-list-filter-bar" data-form={props.form}>
      {band ? null : whose}
      <StageMeter {...parts.meter} />
      <div className="hg-leads-list-filter-bar-chips">
        {band ? whose : null}
        <span className="hg-leads-list-filter-bar-search">
          <SearchField {...parts.search} />
        </span>
        <FacetChips {...parts.dormant} />
        {parts.bill === null ? null : <Button {...parts.bill} />}
        <Menu {...parts.sourceMenu} trigger={<Button {...parts.sourceTrigger} />} />
      </div>
    </div>
  );
}
